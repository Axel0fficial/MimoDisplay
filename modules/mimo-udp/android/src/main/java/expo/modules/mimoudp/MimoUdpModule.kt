package expo.modules.mimoudp

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.SocketException

class MimoUdpModule : Module() {

    private var socket: DatagramSocket? = null
    private var listenerThread: Thread? = null
    @Volatile
    private var listening = false

    override fun definition() = ModuleDefinition {

        Name("MimoUdp")

        Events("onMessage")

        Function("startListening") { port: Int ->

            if (listening) {
                return@Function
            }

            listening = true

            listenerThread = Thread {

                try {

                    socket = DatagramSocket(port)

                    val buffer = ByteArray(2048)

                    while (listening) {

                        val packet = DatagramPacket(
                            buffer,
                            buffer.size
                        )

                        socket?.receive(packet)

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
                                "address" to packet.address.hostAddress
                            )
                        )
                    }

                } catch (e: SocketException) {

                    // Expected when stopListening() closes socket.

                } catch (e: Exception) {

                    sendEvent(
                        "onMessage",
                        mapOf(
                            "message" to "__ERROR__:${e.message}",
                            "address" to ""
                        )
                    )

                } finally {

                    listening = false

                    socket?.close()
                    socket = null
                }
            }

            listenerThread?.start()
        }


        Function("stopListening") {

            listening = false

            socket?.close()
            socket = null

            listenerThread = null
        }


        Function("isListening") {
            listening
        }
    }
}