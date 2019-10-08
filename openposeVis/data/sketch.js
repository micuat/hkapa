let ws = new WebSocket('ws://localhost:8025/staebe');

const sliderProperties = {
	armLength: { min: 0, max: 5, default: 0 },
	legLength: { min: 0, max: 5, default: 0 },
	spineLength: { min: 0, max: 5, default: 0 },
	audioReactive: { min: 0, max: 1, default: 0 },
	background: { min: 0, max: 255, default: 255 }, // alpha
	wander: { min: 0, max: 1, default: 0 },
	terrainNoise: { min: 0, max: 100, default: 0 },
	terrainRot: { min: 0, max: 1, default: 0 },
	terrainAlpha: { min: 0, max: 0.5, default: 0 },
	pathfinder: { min: 0, max: 1, default: 0 }
};
const sliderValues = {};
for (const key in sliderProperties) {
	sliderValues[key] = sliderProperties[key].default;
}
const presets = [
	{
		name: 'blank',
		display: 'Blank',
		sliders: { background: { val: 255, t: 1 } }
	},
	{
		name: 'grid',
		display: 'Grid',
		sliders: {
			background: { val: 255, t: 1 },
			terrainAlpha: { val: 0.1, t: 1 }
		}
	},
	{
		name: 'pfOnGrid',
		display: 'Pathfinder on Grid',
		sliders: {
			background: { val: 255, t: 1 },
			terrainAlpha: { val: 0.1, t: 1 },
			pathfinder: { val: 1, t: 1 }
		}
	},
	{
		name: 'wandering',
		display: 'Wandering',
		sliders: {
			armLength: { val: 1, t: 3 },
			background: { val: 255, t: 1 },
			wander: { val: 1, t: 1, ease: Power0.easeInOut },
			terrainRot: { val: 1, t: 2 },
			terrainAlpha: { val: 0.1, t: 2 },
			pathfinder: { val: 0, t: 4 }
		}
	},
	{
		name: 'armOnBlack',
		display: 'Arm on Black',
		sliders: {
			armLength: { val: 2.5, t: 3 },
			background: { val: 255, t: 3 },
			wander: { val: 0, t: 4, ease: Power0.easeInOut },
			terrainRot: { val: 1, t: 3 }
		}
	},
	{
		name: 'bodyOnVideo',
		display: 'Arm on Video',
		sliders: {
			armLength: { val: 2.5, t: 8 },
			legLength: { val: 2, t: 8 },
			background: { val: 0, t: 8 },
		}
	},
	// {
	// 	name: 'all',
	// 	display: 'All',
	// 	sliders: { ...sliderValues, ...{ armLength: 500, legLength: 200, spineLength: 200 } },
	// 	duration: 1
	// },
	// {
	// 	name: 'keith',
	// 	display: 'Keith',
	// 	sliders: { ...sliderValues, ...{ armLength: 0, legLength: 20, spineLength: 300, background: 1000 } },
	// 	duration: 1
	// }
];

var gui = new dat.gui.GUI();
gui.remember(sliderValues);
for (let key of Object.keys(sliderValues))
	gui.add(sliderValues, key).min(sliderProperties[key].min).max(sliderProperties[key].max).listen().onChange(function (value) {
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
	for (const key in sliderProperties) {
		if (preset.sliders[key] == undefined) {
			let target = { ease: Power2.easeInOut };
			target[key] = sliderProperties[key].default;
			TweenLite.to(sliderValues, 1, target);
		}
		else {
			let target = { ease: Power2.easeInOut };
			target[key] = preset.sliders[key].val;
			if (preset.sliders[key].ease != undefined) {
				target.ease = preset.sliders[key].ease;
			}
			TweenLite.to(sliderValues, preset.sliders[key].t, target);
		}
	}
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

ws.onopen = function (event) {
};

setInterval(() => {
	if (ws.readyState == WebSocket.CLOSED) {
		ws = new WebSocket('ws://localhost:8025/staebe');
	}
}, 1000)
