fetch('https://tec-ia-mvp-production.up.railway.app/api/documents/admin/run-import', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYzAxNTk2OS02MjI1LTRlOTgtYThmMy1kZDc3N2QzMGZmNTQiLCJpYXQiOjE3NzE1MzMzNzMsImV4cCI6MTc3MjEzODE3M30.lZlJW7w3Hywi91bX7JfXkMe92MIOT4opYPzF8L_ZWkk'
    }
}).then(async r => {
    console.log(r.status);
    console.log(await r.text());
}).catch(console.error);
