let ws = new WebSocket('ws://localhost:8025/staebe');

// const numSliders = 10;
const sliderValues = { armLength: 0, legLength: 0, spineLength: 0, audioReactive: 0, background: 0, wander: 0, terrainNoise: 0, terrainRot: 0, terrainAlpha: 0, pathfinder: 0, duration: 0 };
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

var gui = new dat.gui.GUI();
gui.remember(sliderValues);
for (let key of Object.keys(sliderValues))
	gui.add(sliderValues, key).min(0).max(1000).listen().onChange(function (value) {
		let params = { sliderValues };
		if (ws.readyState == WebSocket.OPEN) {
			ws.send(JSON.stringify(params));
		}
	});

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

			easeTo(preset);
		}
	}
});

function easeTo(preset) {
	TweenLite.to(sliderValues, preset.duration, { ...preset.sliders, ...{ ease: Power2.easeInOut, duration: preset.duration } });
	let count = 0;
	let maxCount = preset.duration * 1000 / 10;
	let interval = setInterval(function () {
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

const sliders = [];
for (const key of sliderKeys) {
	let result = key.replace(/([A-Z])/g, " $1");
	let display = result.charAt(0).toUpperCase() + result.slice(1);
	sliders.push({ name: key, display: display })
}

ws.onopen = function (event) {
};

setInterval(() => {
	if (ws.readyState == WebSocket.CLOSED) {
		ws = new WebSocket('ws://localhost:8025/staebe');
	}
}, 1000)
