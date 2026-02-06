import websocket

def on_message(ws, message):
    print(message)

def on_error(ws, error):
    print(error)

def on_close(ws):
    print("### closed ###")

def on_open(ws):
    ws.send('{"type":"subscribe-pr","symbol":"AAPL"}')
    ws.send('{"type":"subscribe-pr","symbol":"AMZN"}')
    ws.send('{"type":"subscribe-pr","symbol":"MSFT"}')
    ws.send('{"type":"subscribe-pr","symbol":"BYND"}')

if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("wss://ws.finnhub.io?token=cua2klhr01qkpes42nu0cua2klhr01qkpes42nug",
                              on_message = on_message,
                              on_error = on_error,
                              on_close = on_close)
    ws.on_open = on_open
    ws.run_forever()