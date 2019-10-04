let ws = new WebSocket('ws://localhost:8025/staebe');

ws.onopen = function (event) {
	for (let i = 0; i < radios.length; i++) {
		radios[i].onclick = function () {
			const preset = presets[this.value];
			for (let j = 0; j < numSliders; j++) {
				TweenLite.to(document.getElementById('slide' + j), preset.duration, { value: preset.sliders[j], autoAlpha: 0, ease: Power2.easeInOut });
			}
			let count = 0;
			let maxCount = preset.duration * 1000 / 10;
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


const numSliders = 10;
const sliderValues = new Array(numSliders);
const presets = {
	grid: { sliders: [0, 0, 0, 0, 1000, 0, 0, 0, 200, 0], duration: 1},
	pfOnGrid: { sliders: [0, 0, 0, 0, 1000, 0, 0, 0, 200, 1000], duration: 1},
	wandering: { sliders: [200, 0, 0, 0, 1000, 1000, 0, 1000, 1000, 0], duration: 1},
	armOnBlack: { sliders: [500, 0, 0, 0, 1000, 0, 0, 1000, 0, 0], duration: 3},
	armOnVideo: { sliders: [500, 0, 0, 0, 0, 0, 0, 0, 0, 0], duration: 8},
	armAndLeg: { sliders: [500, 400, 0, 0, 0, 0, 0, 0, 0, 0], duration: 1},
	all: { sliders: [500, 400, 400, 0, 0, 0, 0, 0, 0, 0], duration: 1},
	keith: { sliders: [0, 200, 300, 0, 1000, 0, 0, 0, 0, 0], duration: 1}
};

let radios = document.forms['presetForm'].elements['preset'];


setInterval(() => {
	if (ws.readyState == WebSocket.CLOSED) {
		ws = new WebSocket('ws://localhost:8025/staebe');
	}
}, 1000)
