function Particle(p, pg) {
    this.pos = { x: Math.random() * pg.width, y: Math.random() * pg.height };
    let v = p5.Vector.random2D();
    // this.vel = {x: -5, y: 5};
    this.vel = { x: 5 * v.x, y: 5 * v.y };
    this.rot = 0;
    this.rVel = (Math.random() - 0.5) * 0.3;
    this.l = 100;
    this.update = function () {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        if (this.pos.x < -this.l) this.pos.x = pg.width / 2 + this.l;
        if (this.pos.x > pg.width / 2 + this.l) this.pos.x = - this.l;
        if (this.pos.y < -this.l) this.pos.y = pg.height / 2 + this.l;
        if (this.pos.y > pg.height / 2 + this.l) this.pos.y = - this.l;
        this.rot += this.rVel;
        let dx = Math.cos(this.rot);
        let dy = Math.sin(this.rot);
        this.x0 = this.pos.x + dx * -this.l * 0.5;
        this.y0 = this.pos.y + dy * -this.l * 0.5;
        this.x1 = this.pos.x + dx * this.l * 0.5;
        this.y1 = this.pos.y + dy * this.l * 0.5;
        // pg.stroke(255);
        // pg.line(this.x0, this.y0, this.x1, this.y1);
    }
}

var s = function (p) {
    let pairs = [[3, 4],
    [6, 7],
    [2, 3],
    [5, 6],
    [2, 9],
    [5, 12],
    [9, 10],
    [12, 13],
    [10, 11],
    [13, 14],
    ];
    let flippedIndex = [0, 1, 5, 6, 7, 2, 3, 4,
        8, 12, 13, 14, 9, 10, 11, 16, 15, 18, 17,
        22, 23, 24, 19, 20, 21];

    let smoothedPoses = [];
    let smoothedAmps = [0, 0, 0, 0];
    let particles = [];

    p.setup = function () {
        // p.createCanvas(1920, 1080);
        // p.createCanvas(1280, 720);
        p.frameRate(30);

        for (let i = 0; i < 100; i++) {
            particles.push(new Particle(p, p.renderPg));
        }
    }

    function unpackPose(pose) {
        let joints = [];
        for (let j = 0; j < pose.length; j += 3) {
            let x = pose[j];
            let y = pose[j + 1];
            if (x == 0) x = undefined;
            if (y == 0) y = undefined;
            let joint = { x: x, y: y }
            joints.push(joint);
        }
        return joints;
    }
    let disappearMax = 15;

    function poseDistance(args) {
        let p0 = args.p0, p1 = args.p1, defaultError = args.defaultError, flipped = args.flipped;
        let error = 0;
        let validCount = 0;
        for (let k = 0; k < p0.length; k++) {
            let idx = k;
            if (flipped !== undefined && flipped == true) {
                idx = flippedIndex[k];
            }
            let x0 = p0[idx].x;
            let y0 = p0[idx].y;
            let x1 = p1[k].x;
            let y1 = p1[k].y;
            if (isNaN(x0) || isNaN(y0) || isNaN(x1) || isNaN(y1)) {
            }
            else {
                error += p.dist(x0, y0, x1, y1);
                validCount++;
            }
        }
        if (validCount > 5) {
            return error / validCount;
        }
        else {
            return defaultError;
        }
    }

    p.tracking = function () {
        let poses = JSON.parse("{" + p.jsonString + "}");
        if (poses.people == undefined) return;
        let peopleRaw = poses.people;
        let people = [];
        for (let i = 0; i < peopleRaw.length; i++) {
            people.push({ pose: unpackPose(peopleRaw[i].pose_keypoints_2d), taken: false });
        }

        let maxError = 100;
        for (let i = 0; i < smoothedPoses.length; i++) {
            let sp = smoothedPoses[i].pose;
            if (smoothedPoses[i].disappearCount >= disappearMax) {
                continue;
            }
            let errors = [];
            // find errors
            for (let j = 0; j < people.length; j++) {
                let pose = people[j].pose;
                if (people[j].taken == true) {
                    errors.push(maxError);
                    continue;
                }

                errors.push(poseDistance({ p0: pose, p1: sp, defaultError: maxError }));
            }

            let minIndex = -1;
            let minError = maxError;
            for (let j = 0; j < errors.length; j++) {
                if (people[j].taken == false && errors[j] < minError) {
                    minIndex = j;
                    minError = errors[j];
                }
            }
            if (minIndex >= 0) {
                let pose = people[minIndex].pose;
                smoothedPoses[i].disappearCount = 0;
                smoothedPoses[i].bornCount++;
                people[minIndex].taken = true;

                // check inversion
                let normalError = minError;
                let flippedError = poseDistance({ p0: sp, p1: pose, flipped: true });
                let flipped = false;
                if (flippedError < normalError) {
                    flipped = true;
                }

                for (let j = 0; j < sp.length; j++) {
                    let idx = j;
                    if (flipped) {
                        idx = flippedIndex[j];
                    }
                    if (isNaN(sp[j].x) || isNaN(sp[j].y)) {
                        sp[j].x = pose[idx].x;
                        sp[j].y = pose[idx].y;
                    }
                    else {
                        sp[j].x = p.lerp(sp[j].x, pose[idx].x, this.lerping);
                        sp[j].y = p.lerp(sp[j].y, pose[idx].y, this.lerping);
                    }
                }
            }
            else {
                smoothedPoses[i].disappearCount++;
            }
        }

        // add new people
        for (let j = 0; j < people.length; j++) {
            if (people[j].taken) {
                continue;
            }
            let pose = people[j].pose;
            id = -1;
            for (let j = 0; j < smoothedPoses.length; j++) {
                if (smoothedPoses[j].disappearCount >= disappearMax) {
                    smoothedPoses[j].pose = pose;
                    smoothedPoses[j].disappearCount = 0;
                    smoothedPoses[j].bornCount = 0;

                    sp = pose;
                    id = j;
                    break;
                }
            }
            if (id < 0) {
                smoothedPoses.push({ pose: pose, disappearCount: 0, bornCount: 0 })
                sp = pose;
                id = smoothedPoses.length - 1;
            }

        }
    }

    p.draw = function () {
        let t = p.millis() * 0.001;
        let tw = t % 2;
        if (tw > 1) tw = 2 - tw;

        p.fft.analyze();

        let jsonUi = JSON.parse(p.jsonUiString);

        let showIds = false;
        let showPoints = false;
        let staebePairToType = [0, 0, 0, 0, 2, 2, 1, 1, 1, 1];
        let staebeMaxLength = 5;
        let staebeLengths = [0, 0, 0];
        if (jsonUi.sliders != undefined) {
            for (let i = 0; i < 3; i++) {
                staebeLengths[i] = jsonUi.sliders[i] / 1000 * staebeMaxLength;
            }
        }
        let staebeLfo = false;
        let staebeLineFade = true;
        let showTrace = false;
        let lerping = 0.5;

        for (let i = 0; i < smoothedAmps.length; i++) {
            smoothedAmps[i] = p.lerp(smoothedAmps[i], p.fft.spectrum[i], 0.5);
            if (jsonUi.sliders != undefined)
                smoothedAmps[i] = p.lerp(1, smoothedAmps[i], jsonUi.sliders[3] / 1000.0);
        }
        let lineColor = { r: 255, g: 255, b: 255 };
        // let lineColor = { r: 255, g: 255-amp*255, b: 255-amp*255 };

        this.lerping = lerping;

        let pg = p.renderPg;
        pg.beginDraw();
        pg.clear();
        pg.textSize(24)
        p.tracking();

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }

        // if(p.frameCount % 30 == 0) {
        //     print(jsonUi.sliders[4])
        // }
        if (jsonUi.sliders != undefined) {
            pg.background(0, 0, 0, jsonUi.sliders[4] / 1000.0 * 255);
        }

        pg.strokeWeight(1);
        pg.noFill();
        pg.stroke(0);
        pg.rect(0, 0, pg.width - 1, pg.height - 1);
        pg.strokeWeight(4);

        pg.pushMatrix();
        pg.scale(p.width / 1280.0, p.height / 720.0);
        let staebeCount = 0;
        for (let i = 0; i < smoothedPoses.length; i++) {
            let smoothedPose = smoothedPoses[i];
            if (smoothedPose.disappearCount >= disappearMax) {
                continue;
            }
            let sp = smoothedPose.pose;

            if (smoothedPose.trace == undefined) {
                smoothedPose.trace = [];
            }
            let trace = smoothedPose.trace;
            let spClone = [];
            for (let j = 0; j < sp.length; j++) {
                spClone.push({ x: sp[j].x, y: sp[j].y });
            }
            trace.push(spClone);
            if (trace.length > 30) {
                trace.shift();
            }
            if (showIds) {
                for (let j = 0; j < sp.length; j++) {
                    if (isNaN(sp[j].x) == false && isNaN(sp[j].y) == false) {
                        pg.text(i + "," + smoothedPose.bornCount, sp[j].x, sp[j].y - 50);
                        break;
                    }
                }
            }

            pg.pushStyle();
            let fadeIn = Math.min(1, smoothedPose.bornCount * 0.05);
            pg.noStroke();
            pg.fill(255, fadeIn * 255);
            if (showPoints) {
                for (let j = 0; j < sp.length; j++) {
                    pg.ellipse(sp[j].x, sp[j].y, 5, 5);
                }
            }
            for (let k = 0; k < trace.length; k++) {
                if (showTrace == false && k != trace.length - 1) {
                    continue;
                }
                let ktw = EasingFunctions.easeInOutCubic(k / trace.length);

                let L = 1;
                if (staebeLineFade) {
                    L *= ktw;
                }
                if (staebeLfo) {
                    L *= EasingFunctions.easeOutCubic(tw);
                }
                for (let j = 0; j < pairs.length; j++) {
                    let staebeType = staebePairToType[j];
                    let l = L * staebeLengths[staebeType];
                    // if(staebeType == 0) {
                    //     l *= p.constrain(smoothedAmps[0] * 2+0.5, 0.5, 1.5);
                    // }
                    // if(staebeType == 1) {
                    //     l *= p.constrain(smoothedAmps[2] * 5, 0.5, 1.5);
                    // }
                    let alpha = fadeIn * 255;
                    if (staebeLengths[staebeType] == 0) {
                        alpha = 0;
                    }
                    pg.stroke(lineColor.r, lineColor.g, lineColor.b, alpha);

                    let i0 = pairs[j][0];
                    let i1 = pairs[j][1];
                    let xt0 = trace[k][i0].x;
                    let yt0 = trace[k][i0].y;
                    let xt1 = trace[k][i1].x;
                    let yt1 = trace[k][i1].y;
                    let xt2 = p.lerp(xt1, xt0, l);
                    let yt2 = p.lerp(yt1, yt0, l);

                    // let xp2 = p.noise(t * 0.5, xt0 * 0.01) * 0.5 * pg.width;
                    // let yp2 = p.noise(t * 0.5, yt0 * 0.01) * 0.5 * pg.height;
                    // let xp1 = p.noise(t * 0.5, xt1 * 0.01) * 0.5 * pg.width;
                    // let yp1 = p.noise(t * 0.5, yt1 * 0.01) * 0.5 * pg.height;
                    let pt = particles[(staebeCount++) % particles.length];
                    let xp2 = pt.x0;
                    let yp2 = pt.y0;
                    let xp1 = pt.x1;
                    let yp1 = pt.y1;

                    let particleLerp = 0;
                    if (jsonUi.sliders != undefined) {
                        particleLerp = jsonUi.sliders[5] / 1000.0;
                    }
                    let x2 = p.lerp(xt2, xp2, particleLerp);
                    let y2 = p.lerp(yt2, yp2, particleLerp);
                    let x1 = p.lerp(xt1, xp1, particleLerp);
                    let y1 = p.lerp(yt1, yp1, particleLerp);
                    pg.line(x2, y2, x1, y1);
                }
                function drawSpaghetti() {
                    pg.noFill();
                    pg.stroke(255);
                    pg.beginShape();
                    pg.curveVertex(trace[index][4].x, trace[index][4].y);
                    pg.curveVertex(trace[index][4].x, trace[index][4].y);
                    pg.curveVertex(trace[index][3].x, trace[index][3].y);
                    pg.curveVertex(trace[index][2].x, trace[index][2].y);
                    // pg.curveVertex(trace[index][1].x, trace[index][1].y);
                    pg.curveVertex(trace[index][5].x, trace[index][5].y);
                    pg.curveVertex(trace[index][6].x, trace[index][6].y);
                    pg.curveVertex(trace[index][7].x, trace[index][7].y);
                    pg.curveVertex(trace[index][7].x, trace[index][7].y);
                    pg.endShape();
                }
            }
            pg.popStyle();
        }
        pg.popMatrix();
        pg.endDraw();
    }
};

var p001 = new p5(s);