using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;

class CreatedGame
{
    public string playerId { get; set; }

    public string gameId { get; set; }

    public int turn { get; set; }
}

class CreatedGameMessage
{
    public string type { get; set; }

    public CreatedGame payload { get; set; }
}

class GameSocketMessage
{
    public string type { get; set; }

    public string payload { get; set; }

    private GameSocketMessage()
    {
    }

    public GameSocketMessage(string type, string payload)
    {
        this.type = type;
        this.payload = payload;
    }

    public override string ToString()
    {
        return $"{{\"type\":\"{type}\",\"payload\":\"{payload}\"}}";
    }
}

class GameServerConnection
{
    private ClientWebSocket ws;

    private CancellationTokenSource
        socketCancelSource = new CancellationTokenSource();

    public string connectionStatus { get; }

    private GameServerConnection()
    {
    }

    public GameServerConnection(Uri socketServerUri)
    {
        ws = new ClientWebSocket();
        Task connectionTask =
            this
                .ws
                .ConnectAsync(socketServerUri, this.socketCancelSource.Token);
        connectionTask.Wait();
        this.connectionStatus = "connected";
    }

    public void Send(string message)
    {
        var sendBuffer =
            new ArraySegment<Byte>(Encoding.UTF8.GetBytes(message));
        Task recieveTask =
            ws
                .SendAsync(sendBuffer,
                WebSocketMessageType.Text,
                true,
                CancellationToken.None);
        recieveTask.Wait();
    }

    public String Receive()
    {
        ArraySegment<byte> receivedBytes =
            new ArraySegment<byte>(new byte[1024]);
        Task recieveTask =
            ws.ReceiveAsync(receivedBytes, CancellationToken.None);
        recieveTask.Wait();
        return Encoding.UTF8.GetString(receivedBytes.Array);
    }
}

public class GFG
{
    public static void Main()
    {
        GameServerConnection gsConnection =
            new GameServerConnection(new Uri("ws://localhost:8082"));
        Console.WriteLine(gsConnection.connectionStatus);
        GameSocketMessage startMessage =
            new GameSocketMessage("create_game", "data");
        gsConnection.Send(startMessage.ToString());
    }
}
