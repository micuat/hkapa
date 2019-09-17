s.options.device = "0";
s.boot;


(
SynthDef(\sin, { arg outBus = 0, freq = 440, carPartial = 1, modPartial = 1, index = 3, mul = 1.0, pos = 0.0;
	var mod;
	var car;
	mod = SinOsc.ar(
		freq: freq * modPartial,
		mul: freq * index * LFNoise1.kr(5.reciprocal).abs
	);

	car = SinOsc.ar(
		freq: (freq * carPartial) + mod,
		mul: mul
	);

	Out.ar(outBus, Pan2.ar(car, pos))
}).add;

SynthDef(\mixer, { arg outBus = 0, gain0 = 0.0, inBus0, gain1 = 0.0, inBus1;
	Out.ar(outBus, DelayN.ar(In.ar(inBus0, 2), 0.01, 0.01, gain0) + DelayN.ar(In.ar(inBus1, 2), 0.01, 0.01, gain1));
}).add;

SynthDef(\feedback, { arg outBus = 0, gain = 0.0, inBus, delay = 0.1, effect;
	Out.ar(outBus, (DelayN.ar(Limiter.ar(InFeedback.ar(outBus, 2)),1.0,delay,effect)+gain*DelayN.ar(In.ar(inBus, 2), 0.01, 0.01)));
}).add;

SynthDef(\reverb, { arg outBus = 0, inBus, effect, mix = 0.25, room = 0.15, damp = 0.5;
    var input, input0;
    input0 = In.ar(inBus, 1);

    input = FreeVerb.ar(
        input0, // mono src
        mix, // mix 0-1
        room, // room 0-1
		damp // damp 0-1 duh
	) ! 2;
	Out.ar(outBus, input * effect + (1-effect) * input0);
}).add;
)
a = Synth.new(\sin, [\outBus, 0, \freq, 440, \carPartial,10, \modPartial, 1.99, \mul, 3]);
{ SinOsc.ar(200, 0, 0.5) }.play;


(

a = Synth.new(\sin, [\outBus, 0, \freq, 30, \carPartial, 3.6, \modPartial, 2.5, \mul, 0.2, \pos, 0.0]);
b = Synth.new(\sin, [\outBus, 0, \freq, 20, \carPartial, 3.6, \modPartial, 2.5, \mul, 0.1]);

OSCdef(\control00, {|msg|
	a.set(\freq, msg[1] * 1);
}, "/control/00");

OSCdef(\control01, {|msg|
	a.set(\carPartial, msg[1] * 1);
}, "/control/01");

OSCdef(\control02, {|msg|
	a.set(\modPartial, msg[1] * 1);
}, "/control/02");

OSCdef(\control03, {|msg|
	a.set(\mul, msg[2] * 0.2);
	b.set(\mul, 0);
	// a.set(\freq, (5.0 - msg[1]) * 0.5 + 40);
	a.set(\carPartial, (5.0 - msg[1]) * 0.02 + 3.2);
	a.set(\modPartial, (5.0 - msg[1]) * 0.95 + 0.5);
	b.set(\carPartial, (5.0 - msg[1]) * 0.2 + 3.2);
	b.set(\modPartial, (5.0 - msg[1]) * 1.95 + 0.5);
	a.set(\index, 30.0 * 24 * 0.001);
	b.set(\index, 50.0 * 24 * 0.001);

	a.set(\pos, msg[3]);
}, "/control/a");

)
