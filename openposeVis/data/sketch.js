const ws = new WebSocket('ws://localhost:8025/staebe');

ws.onopen = function (event) {
	let params = { msg: "hoi" }
	ws.send(JSON.stringify(params));
};


const sliderValues = new Array(8);
for (let i = 0; i < 8; i++) {
	sliderValues[i] = 0;
	document.getElementById('slide' + i).oninput = function () {
		sliderValues[i] = this.value;
		let params = { sliders: sliderValues };
		ws.send(JSON.stringify(params));
	}
}