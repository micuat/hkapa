let ws = new WebSocket('ws://localhost:8025/staebe');

// const numSliders = 10;
const sliderValues = { armLength: 0, legLength: 0, spineLength: 0, audioReactive: 0, background: 0, wander: 0, terrainNoise: 0, terrainRot: 0, terrainAlpha: 0, pathfinder: 0 };
const presets = [
	{
		name: 'blank',
		display: 'Blank',
		sliders: { ...sliderValues, ...{ background: 1000 } },
		duration: 1
	},
	{
		name: 'grid',
		display: 'Grid',
		sliders: { ...sliderValues, ...{ background: 1000, terrainAlpha: 200 } },
		duration: 1
	},
	{
		name: 'pfOnGrid',
		display: 'Pathfinder on Grid',
		sliders: { ...sliderValues, ...{ background: 1000, terrainAlpha: 200, pathfinder: 1000 } },
		duration: 1
	},
	{
		name: 'wandering',
		display: 'Wandering',
		sliders: { ...sliderValues, ...{ armLength: 200, background: 1000, wander: 1000, terrainRot: 1000, terrainAlpha: 1000 } },
		duration: 1
	},
	{
		name: 'armOnBlack',
		display: 'Arm on Black',
		sliders: { ...sliderValues, ...{ armLength: 500, background: 1000, terrainRot: 1000 } },
		duration: 3
	},
	{
		name: 'armOnVideo',
		display: 'Arm on Video',
		sliders: { ...sliderValues, ...{ armLength: 500, } },
		duration: 8
	},
	{
		name: 'armAndLeg',
		display: 'Arm and Leg',
		sliders: { ...sliderValues, ...{ armLength: 500, legLength: 400 } },
		duration: 1
	},
	{
		name: 'all',
		display: 'All',
		sliders: { ...sliderValues, ...{ armLength: 500, legLength: 200, spineLength: 200 } },
		duration: 1
	},
	{
		name: 'keith',
		display: 'Keith',
		sliders: { ...sliderValues, ...{ armLength: 0, legLength: 20, spineLength: 300, background: 1000 } },
		duration: 1
	}
];
const sliderKeys = Object.keys(presets[0].sliders);

new Vue({
	el: '#radioContainer',
	data: {
		presets,
		checked: 'none',
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
});

const sliders = [];
for (const key of sliderKeys) {
	let result = key.replace( /([A-Z])/g, " $1" );
	let display = result.charAt(0).toUpperCase() + result.slice(1);
	sliders.push({name: key, display: display})
}
new Vue({
	el: '#slideContainer',
	data: {
		sliders,
		checked: 'none',
	}
});

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
