from collections import deque

class ChatMemory:
    def __init__(self, max_len=10):
        self.history = deque(maxlen=max_len)

    def add(self, user_msg: str, bot_msg: str):
        self.history.append({"user": user_msg, "bot": bot_msg})

    def get(self):
        return list(self.history)

    def clear(self):
        self.history.clear()
