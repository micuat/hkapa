let ws = new WebSocket('ws://localhost:8025/staebe');

ws.onopen = function (event) {
	let params = { msg: "hoi" }
	ws.send(JSON.stringify(params));
};


const sliderValues = new Array(8);
for (let i = 0; i < 5; i++) {
	sliderValues[i] = 0;
	document.getElementById('slide' + i).oninput = function () {
		sliderValues[i] = this.value;
		let params = { sliders: sliderValues };
		ws.send(JSON.stringify(params));
	}
}

setInterval(() => {
	if(ws.readyState == 3) {
		ws = new WebSocket('ws://localhost:8025/staebe');
	}
}, 1000)
