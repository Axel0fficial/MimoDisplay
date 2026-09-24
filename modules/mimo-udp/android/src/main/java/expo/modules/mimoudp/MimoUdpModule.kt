package expo.modules.mimoudp

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException

class MimoUdpModule : Module() {

    // ----------------------------------------------------
    // UDP
    // ----------------------------------------------------

    private var udpSocket: DatagramSocket? = null
    private var udpThread: Thread? = null

    @Volatile
    private var udpListening = false

    // ----------------------------------------------------
    // HTTP
    // ----------------------------------------------------

    private var httpServerSocket: ServerSocket? = null
    private var httpThread: Thread? = null

    @Volatile
    private var httpListening = false

    override fun definition() = ModuleDefinition {

        Name("MimoUdp")

        Events(
            "onMessage",
            "onHttpRequest"
        )

        // ==================================================
        // UDP
        // ==================================================

        Function("startListening") { port: Int ->

            if (udpListening) {
                return@Function false
            }

            udpListening = true

            udpThread = Thread {

                try {

                    udpSocket = DatagramSocket(port)

                    val buffer = ByteArray(2048)

                    while (udpListening) {

                        val packet = DatagramPacket(
                            buffer,
                            buffer.size
                        )

                        udpSocket?.receive(packet)

                        val message = String(
                            packet.data,
                            packet.offset,
                            packet.length,
                            Charsets.UTF_8
                        )

                        sendEvent(
                            "onMessage",
                            mapOf(
                                "message" to message,
                                "address" to (
                                    packet.address?.hostAddress ?: ""
                                )
                            )
                        )
                    }

                } catch (e: SocketException) {

                    // Expected when stopping.

                } catch (e: Exception) {

                    sendEvent(
                        "onMessage",
                        mapOf(
                            "message" to "__ERROR__:${e.message}",
                            "address" to ""
                        )
                    )

                } finally {

                    udpListening = false

                    udpSocket?.close()
                    udpSocket = null
                }
            }

            udpThread?.start()

            return@Function true
        }

        Function("stopListening") {

            udpListening = false

            udpSocket?.close()
            udpSocket = null

            udpThread = null

            return@Function true
        }

        Function("isListening") {
            return@Function udpListening
        }

        // ==================================================
        // HTTP
        // ==================================================

        Function("startHttpServer") { port: Int ->

            if (httpListening) {
                return@Function false
            }

            httpListening = true

            httpThread = Thread {

                try {

                    httpServerSocket = ServerSocket(port)

                    while (httpListening) {

                        val client =
                            httpServerSocket?.accept()
                                ?: continue

                        Thread {
                            handleHttpClient(client)
                        }.start()
                    }

                } catch (e: SocketException) {

                    // Expected when stopping server.

                } catch (e: Exception) {

                    sendEvent(
                        "onHttpRequest",
                        mapOf(
                            "method" to "ERROR",
                            "path" to "",
                            "body" to (
                                e.message ?: "Unknown HTTP error"
                            )
                        )
                    )

                } finally {

                    httpListening = false

                    httpServerSocket?.close()
                    httpServerSocket = null
                }
            }

            httpThread?.start()

            return@Function true
        }

        Function("stopHttpServer") {

            httpListening = false

            httpServerSocket?.close()
            httpServerSocket = null

            httpThread = null

            return@Function true
        }

        Function("isHttpListening") {
            return@Function httpListening
        }
    }

    // ======================================================
    // HTTP CLIENT HANDLER
    // ======================================================

    private fun handleHttpClient(client: Socket) {

        try {

            client.soTimeout = 5000

            val reader = BufferedReader(
                InputStreamReader(
                    client.getInputStream(),
                    Charsets.UTF_8
                )
            )

            val requestLine =
                reader.readLine() ?: return

            val requestParts =
                requestLine.split(" ")

            if (requestParts.size < 2) {
                sendHttpResponse(
                    client,
                    400,
                    """{"error":"Invalid request"}"""
                )

                return
            }

            val method =
                requestParts[0].uppercase()

            val path =
                requestParts[1]

            // Read headers

            val headers =
                mutableMapOf<String, String>()

            while (true) {

                val line =
                    reader.readLine() ?: break

                if (line.isEmpty()) {
                    break
                }

                val separator =
                    line.indexOf(":")

                if (separator > 0) {

                    val name =
                        line.substring(
                            0,
                            separator
                        )
                            .trim()
                            .lowercase()

                    val value =
                        line.substring(
                            separator + 1
                        )
                            .trim()

                    headers[name] = value
                }
            }

            val contentLength =
                headers["content-length"]
                    ?.toIntOrNull()
                    ?: 0

            var body = ""

            if (contentLength > 0) {

                val chars =
                    CharArray(contentLength)

                var totalRead = 0

                while (
                    totalRead < contentLength
                ) {

                    val count =
                        reader.read(
                            chars,
                            totalRead,
                            contentLength - totalRead
                        )

                    if (count <= 0) {
                        break
                    }

                    totalRead += count
                }

                body = String(
                    chars,
                    0,
                    totalRead
                )
            }

            // ----------------------------------------------
            // Initial API
            // ----------------------------------------------

            when {

                method == "GET" &&
                path == "/status" -> {

                    sendHttpResponse(
                        client,
                        200,
                        """
                        {
                          "device": "MimoDisplay",
                          "status": "online",
                          "udpPort": 5005,
                          "httpPort": 8080
                        }
                        """.trimIndent()
                    )
                }

                method == "GET" &&
                path == "/ping" -> {

                    sendHttpResponse(
                        client,
                        200,
                        """{"message":"pong"}"""
                    )
                }

                else -> {

                    // Tell React Native about the request.
                    // We'll use this for publishing shortly.

                    sendEvent(
                        "onHttpRequest",
                        mapOf(
                            "method" to method,
                            "path" to path,
                            "body" to body
                        )
                    )

                    sendHttpResponse(
                        client,
                        404,
                        """{"error":"Unknown endpoint"}"""
                    )
                }
            }

        } catch (e: Exception) {

            try {

                sendHttpResponse(
                    client,
                    500,
                    """{"error":"Internal server error"}"""
                )

            } catch (_: Exception) {
            }

        } finally {

            try {
                client.close()
            } catch (_: Exception) {
            }
        }
    }

    private fun sendHttpResponse(
        client: Socket,
        statusCode: Int,
        body: String
    ) {

        val statusText =
            when (statusCode) {
                200 -> "OK"
                400 -> "Bad Request"
                404 -> "Not Found"
                500 -> "Internal Server Error"
                else -> "OK"
            }

        val bodyBytes =
            body.toByteArray(
                Charsets.UTF_8
            )

        val output =
            client.getOutputStream()

        val headers =
            buildString {

                append(
                    "HTTP/1.1 $statusCode $statusText\r\n"
                )

                append(
                    "Content-Type: application/json; charset=utf-8\r\n"
                )

                append(
                    "Content-Length: ${bodyBytes.size}\r\n"
                )

                append(
                    "Connection: close\r\n"
                )

                append("\r\n")
            }

        output.write(
            headers.toByteArray(
                Charsets.UTF_8
            )
        )

        output.write(bodyBytes)

        output.flush()
    }
}