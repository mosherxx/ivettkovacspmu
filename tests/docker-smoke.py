"""Run against a disposable, freshly initialized standalone instance, never production.
Usage: python3 tests/docker-smoke.py http://localhost:3100
"""
import sys,json,urllib.request,urllib.error,http.cookiejar,datetime,concurrent.futures
base=sys.argv[1]
assert base.startswith(('http://localhost:', 'http://127.0.0.1:')), 'Local disposable instance only'
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def request(path,data=None,method=None,raw=None,ctype='application/json',origin=None):
 body=raw if raw is not None else json.dumps(data).encode() if data is not None else None
 req=urllib.request.Request(base+path,data=body,method=method,headers={'Origin':origin or base,'Content-Type':ctype})
 try:
  response=client.open(req);code=response.status;value=response.read()
 except urllib.error.HTTPError as e:code=e.code;value=e.read()
 try:value=json.loads(value)
 except:pass
 return code,value
assert request('/')[0]==200
assert request('/api/admin')[0]==403
assert request('/api/catalog')[0]==200
photos=request('/api/gallery')[1]['photos'];assert len(photos)==15
assert request('/api/photos/portfolio-lips')[0]==200
assert len(request('/api/faq')[1]['faqs'])==8
assert request('/api/auth',{'action':'login','username':'admin','password':'admin'})[1]['mustChange']
assert request('/api/admin')[0]==403
password='Disposable-Smoke-Test-2026!'
assert request('/api/auth',{'action':'password','password':'admin','newPassword':password})[0]==200
assert request('/api/auth',{'action':'login','username':'admin','password':password})[0]==200
assert request('/api/admin')[0]==200
assert request('/api/admin',{'action':'hours','hours':[]},origin='https://wrong.example')[0]==403
# Multipart upload exercises persistent file storage and metadata.
photo=open('public/photos/lips.jpg','rb').read();boundary='ivett-smoke'
parts=[]
for k,v in [('service','lips'),('caption_hu','Teszt'),('caption_en','Test')]:parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode()+photo+f'\r\n--{boundary}--\r\n'.encode())
code,value=request('/api/gallery',raw=b''.join(parts),ctype='multipart/form-data; boundary='+boundary);assert code==200,(code,value)
assert request('/api/photos/'+value['id'])[1]==photo
assert request('/api/gallery',dict(id=value['id'],service='lips',caption_hu='Teszt',caption_en='Test',published=0),method='PATCH')[0]==200
assert len(request('/api/gallery')[1]['photos'])==15
# Same SQL contract used by the Cloudflare runtime: atomic overlapping insert, status outbox.
day=datetime.date.today()+datetime.timedelta(days=10)
while day.weekday()!=0:day+=datetime.timedelta(days=1)
date=day.isoformat();assert 540 in request('/api/booking?date='+date+'&service=consult')[1]['slots']
booking=dict(date=date,start=540,service='consult',name='Local Test',email='test@example.com',phone='+36123456789',consent=True,previousTreatment='no',previousDetails='',referral='',quotedPrice=10000,language='en')
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:request('/api/booking',booking),range(2)))
assert sorted(r[0] for r in results)==[200,409],results
id=next(r[1]['id'] for r in results if r[0]==200)
for state in ['confirmed','cancelled']:
 result=request('/api/admin',dict(action='status',id=id,status=state));assert result[0]==200,result
assert 540 in request('/api/booking?date='+date+'&service=consult')[1]['slots']
assert request('/api/admin',dict(action='status',id=id,status='confirmed'))[0]==409
print('PASS: standalone migrations, photos, FAQ, auth/rotation, CSRF, upload/hide, concurrent booking, confirmation/cancellation and availability.')
