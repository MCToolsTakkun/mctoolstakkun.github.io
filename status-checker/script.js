document.getElementById('checkStatus').addEventListener('click', function() {
    const serverType = document.getElementById('serverType').value;
    const serverAddress = document.getElementById('serverAddress').value;

    if (!serverAddress) {
        alert('サーバーアドレスを入力してください。');
        return;
    }

    const apiUrl = serverType === 'java'
        ? `https://api.mcsrvstat.us/2/${serverAddress}`
        : `https://api.mcsrvstat.us/bedrock/2/${serverAddress}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            displayStatus(data);
        })
        .catch(error => {
            document.getElementById('status').innerText = 'サーバーに接続できません。';
        });
});

function displayStatus(data) {
    const statusDiv = document.getElementById('status');
    if (data.online) {
        statusDiv.innerHTML = `<strong>ステータス：</strong>オンライン<br>
                               <strong>プレイヤー数：</strong>${data.players.online}/${data.players.max}<br>
                               <strong>TPS：</strong>${data.tps.join(', ')}<br>
                               <strong>Ping：</strong>${data.latency} ms`;
    } else {
        statusDiv.innerText = 'サーバーはオフラインです。';
    }
}
