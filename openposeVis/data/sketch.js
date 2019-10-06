let ws = new WebSocket('ws://localhost:8025/staebe');

// const numSliders = 10;
const presets = [
	{
		name: 'grid',
		sliders: {armLength: 0, legLength: 0, spineLength: 0, audioReactive: 0, background: 1000, wander: 0, terrainNoise: 0, terrainRot: 0, terrainAlpha: 200, pathfinder: 0},
		duration: 1
	},
	{
		name: 'pfOnGrid',
		sliders: {armLength: 0, legLength: 0, spineLength: 0, audioReactive: 0, background: 1000, wander: 0, terrainNoise: 0, terrainRot: 0, terrainAlpha: 200, pathfinder: 1000},
		duration: 1
	},
	{
		name: 'wandering',
		sliders: {armLength: 200, legLength: 0, spineLength: 0, audioReactive: 0, background: 1000, wander: 1000, terrainNoise: 0, terrainRot: 1000, terrainAlpha: 1000, pathfinder: 0},
		duration: 1
	},
	{
		name: 'armOnBlack',
		sliders: {armLength: 500, legLength: 0, spineLength: 0, audioReactive: 0, background: 1000, wander: 0, terrainNoise: 0, terrainRot: 1000, terrainAlpha: 0, pathfinder: 0},
		duration: 3
	},
	{
		name: 'armOnVideo',
		sliders: {armLength: 500, legLength: 0, spineLength: 0, audioReactive: 0, background: 0, wander: 0, terrainNoise: 0, terrainRot: 0, terrainAlpha: 0, pathfinder: 0},
		duration: 8
	},
	{
		name: 'armAndLeg',
		sliders: {armLength: 500, legLength: 400, spineLength: 0, audioReactive: 0, background: 0, wander: 0, terrainNoise: 0, terrainRot: 0, terrainAlpha: 0, pathfinder: 0},
		duration: 1
	},
	{
		name: 'all',
		sliders: {armLength: 500, legLength: 200, spineLength: 200, audioReactive: 0, background: 0, wander: 0, terrainNoise: 0, terrainRot: 0, terrainAlpha: 0, pathfinder: 0},
		duration: 1
	},
	{
		name: 'keith',
		sliders: {armLength: 0, legLength: 20, spineLength: 300, audioReactive: 0, background: 1000, wander: 0, terrainNoise: 0, terrainRot: 0, terrainAlpha: 0, pathfinder: 0},
		duration: 1
	}
];
// const dummy = { armLength: 0, legLength: 0, spineLength: 0, audioReactive: 0, background: 0, wander: 0, terrainNoise: 0, terrainRot: 0, terrainAlpha: 0, pathfinder: 0 }
const sliderKeys = Object.keys(presets[0].sliders);
const sliderValues = { armLength: 0, legLength: 0, spineLength: 0, audioReactive: 0, background: 0, wander: 0, terrainNoise: 0, terrainRot: 0, terrainAlpha: 0, pathfinder: 0 };

new Vue({
	el: '#app',
	data: {
		presets,
		checked: '',
	},
	watch: {
		checked: function (val) {
			const preset = presets.filter(obj => {
				return obj.name == val
			})[0];
			for (let key of sliderKeys) {
				TweenLite.to(document.getElementById(key), preset.duration, { value: preset.sliders[key], autoAlpha: 0, ease: Power2.easeInOut });
			}
			let count = 0;
			let maxCount = preset.duration * 1000 / 10;
			let interval = setInterval(function () {
				for (let key of sliderKeys) {
					sliderValues[key] = document.getElementById(key).value;
				}
				let params = { sliderValues };
				if (ws.readyState == WebSocket.OPEN) {
					ws.send(JSON.stringify(params));
				}
				count++;
				if (count >= maxCount) {
					clearInterval(interval);
				}
			}, 10);
		}
	}
})

ws.onopen = function (event) {
	for (let key of sliderKeys) {
		// sliderValues[i] = 0;
		document.getElementById(key).oninput = function () {
			sliderValues[key] = this.value;
			let params = { sliderValues };
			if (ws.readyState == WebSocket.OPEN) {
				ws.send(JSON.stringify(params));
			}
		}
	}
};

setInterval(() => {
	if (ws.readyState == WebSocket.CLOSED) {
		ws = new WebSocket('ws://localhost:8025/staebe');
	}
}, 1000)
