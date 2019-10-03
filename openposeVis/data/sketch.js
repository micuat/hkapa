let ws = new WebSocket('ws://localhost:8025/staebe');

ws.onopen = function (event) {
	for (let i = 0; i < radios.length; i++) {
		radios[i].onclick = function () {
			const preset = presets[this.value];
			for (let j = 0; j < 5; j++) {
				TweenLite.to(document.getElementById('slide' + j), 1, { value: preset[j], autoAlpha: 0, ease: Power4.easeInOut });
			}
			let count = 0;
			let maxCount = 100;
			let interval = setInterval(function () {
				for (let j = 0; j < numSliders; j++) {
					sliderValues[j] = document.getElementById('slide' + j).value;
				}
				let params = { sliders: sliderValues };
				if (ws.readyState == WebSocket.OPEN) {
					ws.send(JSON.stringify(params));
				}
				count++;
				if (count >= maxCount) {
					clearInterval(interval);
				}
			}, 10);
		};
	}
	
	for (let i = 0; i < numSliders; i++) {
		sliderValues[i] = 0;
		document.getElementById('slide' + i).oninput = function () {
			sliderValues[i] = this.value;
			let params = { sliders: sliderValues };
			if (ws.readyState == WebSocket.OPEN) {
				ws.send(JSON.stringify(params));
			}
		}
	}
};


const sliderValues = new Array(8);
const presets = [
	[200, 0, 0, 0, 1000, 0, 0, 0],
	[200, 0, 0, 0, 0, 0, 0, 0],
	[200, 0, 0, 0, 0, 0, 0, 0],
	[200, 200, 0, 0, 0, 0, 0, 0],
	[200, 200, 200, 0, 0, 0, 0, 0]
];

const numSliders = 5;
let radios = document.forms['presetForm'].elements['preset'];


setInterval(() => {
	if (ws.readyState == WebSocket.CLOSED) {
		ws = new WebSocket('ws://localhost:8025/staebe');
	}
}, 1000)
