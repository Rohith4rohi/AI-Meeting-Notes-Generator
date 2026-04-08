const http = require('http');
const req = http.request('http://localhost:5000/api/auth/login', { 
  method: 'POST', 
  headers: {'Content-Type': 'application/json'} 
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const t = parsed.token;
      
      const r2 = http.request(`${BASE_URL}/api/meetings`, {
        method: 'GET', 
        headers: {Authorization: 'Bearer ' + t}
      }, (res2) => {
        let d2 = '';
        res2.on('data', c => d2 += c);
        res2.on('end', () => {
          const ms = JSON.parse(d2).meetings;
          if (ms && ms.length > 0) {
            const meetingId = ms[0]._id;
            console.log('Found Meeting:', meetingId);
            
            const urls = [
              '/api/meetings/'+meetingId+'/share',
              '/api/export/'+meetingId+'/pdf'
            ];
            
            urls.forEach(url => {
              const rEx = http.request('http://localhost:5000' + url, {
                method: url.includes('share') ? 'POST' : 'GET', 
                headers: {Authorization: 'Bearer ' + t}
              }, resEx => {
                let dEx = '';
                resEx.on('data', c => dEx += c);
                resEx.on('end', () => console.log(url, 'RESPONSE:', dEx));
              });
              rEx.end();
            });
            
          } else {
             console.log("No meetings found to test.");
          }
        });
      });
      r2.end();
    } catch(e) {
      console.log('Error:', e.message, data);
    }
  });
});
req.write(JSON.stringify({email: 'demo@meetmind.ai', password: 'demo123'}));
req.end();
