import json
import random
import urllib.request

base = 'http://127.0.0.1:8000'
username = f'verify_user_{random.randint(1000,9999)}'

payload = json.dumps({
    'username': username,
    'password': 'Test123!',
    'full_name': 'Verifier',
    'avatar_url': 'https://example.com/a.png'
}).encode()
req = urllib.request.Request(base + '/auth/register', data=payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as r:
    register_data = json.loads(r.read().decode())
    print('REGISTER', json.dumps(register_data))

login_payload = json.dumps({'username': username, 'password': 'Test123!'}).encode()
login_req = urllib.request.Request(base + '/auth/login', data=login_payload, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(login_req) as r:
    login_data = json.loads(r.read().decode())
    print('LOGIN', json.dumps(login_data))

with urllib.request.urlopen(base + '/gamification/quests') as r:
    quests_data = json.loads(r.read().decode())
    print('QUESTS', json.dumps(quests_data[:2]))

farm_id = login_data['user']['farm_id']
with urllib.request.urlopen(base + f'/gamification/farm-detail/{farm_id}') as r:
    farm_data = json.loads(r.read().decode())
    print('FARM', json.dumps({'farm_id': farm_data['farm_id'], 'name': farm_data['name'], 'block_count': len(farm_data['blocks'])}))
