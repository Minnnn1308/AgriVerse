import json
import urllib.request

base = 'http://127.0.0.1:8002'
paths = ['/gamification/quests', '/gamification/profile/J-007']
for p in paths:
    try:
        with urllib.request.urlopen(base + p, timeout=5) as r:
            data = r.read().decode()
            print(p, '=>', data[:400])
    except Exception as e:
        print(p, 'ERROR =>', repr(e))
