function Ring(x, y) {
    this.x = x;
    this.y = y;
    this.count = 0;
    this.maxCount = 30;
    this.draw = function (pg, pathfinderDraw) {
        let r = 10 + this.count * 0.5;
        let alpha = pathfinderDraw * (this.maxCount - this.count) / this.maxCount;
        pg.stroke(255, alpha * 255);
        pg.ellipse(this.x, this.y, r, r);
        this.count++;
        if (this.count >= this.maxCount) {
            return true;
        }
        else return false;
    }
}
function Pathfinder(p) {
    this.x = 0;
    this.y = 0;
    this.target = {
        x: 0,
        y: 0,
        sx: 0,
        sy: 0,
        rot: 0
    }
    this.orig = {
        x: 0,
        y: 0,
        sx: 0,
        sy: 0,
        rot: 0
    }
    this.cycle = 0.5;
    this.lastT = -100;
    this.tick = 50 / 1.2 * 1.5;
    this.rings = [];
    this.draw = function (pathfinderDraw, pg, t) {
        if (pathfinderDraw == 0) return;
        if (Math.floor(t / this.cycle) - Math.floor(this.lastT) > 0) {
            if (this.target.rot % 2 == 0) {
                this.rings.push(new Ring((this.target.x + this.target.sx) * this.tick, (this.target.y + this.target.sy) * this.tick));
                this.rings.push(new Ring((this.target.x - this.target.sx) * this.tick, (this.target.y + this.target.sy) * this.tick));
                this.rings.push(new Ring((this.target.x - this.target.sx) * this.tick, (this.target.y - this.target.sy) * this.tick));
                this.rings.push(new Ring((this.target.x + this.target.sx) * this.tick, (this.target.y - this.target.sy) * this.tick));
            }
            else {
                this.rings.push(new Ring((this.target.x + this.target.sy) * this.tick, (this.target.y + this.target.sx) * this.tick));
                this.rings.push(new Ring((this.target.x - this.target.sy) * this.tick, (this.target.y + this.target.sx) * this.tick));
                this.rings.push(new Ring((this.target.x - this.target.sy) * this.tick, (this.target.y - this.target.sx) * this.tick));
                this.rings.push(new Ring((this.target.x + this.target.sy) * this.tick, (this.target.y - this.target.sx) * this.tick));
            }
            this.lastT = t / this.cycle;
            this.orig = this.target;
            this.target = {
                x: this.orig.x,
                y: this.orig.y,
                sx: this.orig.sx,
                sy: this.orig.sy,
                rot: this.orig.rot
            }
            let rand = Math.random();
            if (rand > 0.8) {
                this.target.x = Math.floor(p.random(-5, 6));
            }
            else if (rand > 0.6) {
                this.target.y = Math.floor(p.random(-5, 6));
            }
            else if (rand > 0.4) {
                this.target.sx = Math.floor(p.random(0, 4));
            }
            else if (rand > 0.2) {
                this.target.sy = Math.floor(p.random(0, 4));
            }
            else {
                this.target.rot = Math.floor(p.random(0, 4));
            }
        }
        let tw = EasingFunctions.easeInOutCubic(t / this.cycle - this.lastT);
        this.x = p.lerp(this.orig.x, this.target.x, tw);
        this.y = p.lerp(this.orig.y, this.target.y, tw);
        this.sx = p.lerp(this.orig.sx, this.target.sx, tw);
        this.sy = p.lerp(this.orig.sy, this.target.sy, tw);
        this.rot = p.lerp(this.orig.rot, this.target.rot, tw);
        let r = 10;
        pg.pushStyle();
        pg.pushMatrix();
        pg.translate(1920 / 2, 1080 / 2);

        for (let i = this.rings.length - 1; i >= 0; i--) {
            if (this.rings[i].draw(pg, pathfinderDraw)) {
                this.rings.splice(i, 1);
            }
        }

        pg.fill(190, 249, 243, 255 * pathfinderDraw);
        pg.noStroke();
        pg.translate(this.x * this.tick, this.y * this.tick);
        pg.rotate(this.rot * Math.PI * 0.5);
        pg.ellipse((+this.sx) * this.tick, (+this.sy) * this.tick, r, r);
        pg.ellipse((-this.sx) * this.tick, (+this.sy) * this.tick, r, r);
        pg.ellipse((-this.sx) * this.tick, (-this.sy) * this.tick, r, r);
        pg.ellipse((+this.sx) * this.tick, (-this.sy) * this.tick, r, r);

        pg.stroke(255, 255 * pathfinderDraw);
        pg.noFill();
        pg.rect(-this.sx * this.tick, -this.sy * this.tick, this.sx * 2 * this.tick, this.sy * 2 * this.tick);
        pg.popMatrix();
        pg.popStyle();
    }
}

function Particle(p, pg) {
    this.pos = { x: Math.random() * pg.width, y: Math.random() * pg.height };
    let v = p5.Vector.random2D();
    // this.vel = {x: -5, y: 5};
    this.z = p.random(0.5, 3);
    this.vel = { x: 5 / this.z * v.x, y: 5 / this.z * v.y };
    this.rot = 0;
    this.rVel = (Math.random() - 0.5) * 0.3;
    this.l = 200 / this.z;
    this.toUpdate = true;
    this.update = function (l) {
        if (this.toUpdate == false) {
            return;
        }
        this.toUpdate = false;
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        let w = 1920, h = 1080;
        if (this.pos.x < -this.l) this.pos.x = w + this.l;
        if (this.pos.x > w + this.l) this.pos.x = - this.l;
        if (this.pos.y < -this.l) this.pos.y = h + this.l;
        if (this.pos.y > h + this.l) this.pos.y = - this.l;
        this.rot += this.rVel;
        let dx = Math.cos(this.rot);
        let dy = Math.sin(this.rot);
        this.x0 = this.pos.x + dx * -this.l * 0.5 * l;
        this.y0 = this.pos.y + dy * -this.l * 0.5 * l;
        this.x1 = this.pos.x + dx * this.l * 0.5 * l;
        this.y1 = this.pos.y + dy * this.l * 0.5 * l;
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
    [9, 10, 10, 11],
    [12, 13, 13, 14],
    [10, 11, 9, 10],
    [13, 14, 12, 13],
    ];
    let flippedIndex = [0, 1, 5, 6, 7, 2, 3, 4,
        8, 12, 13, 14, 9, 10, 11, 16, 15, 18, 17,
        22, 23, 24, 19, 20, 21];
    let staebePairToType = [0, 0, 0, 0, 2, 2, 1, 1, 1, 1];

    let smoothedPoses = [];
    let smoothedAmps = [0, 0, 0, 0];
    let particles = [];

    let terrainBottom = {
        tl: [100*1.5, 550*1.5],
        tr: [1180*1.5, 550*1.5],
        bl: [-500*1.5, 690*1.5],
        br: [1780*1.5, 690*1.5]
    }
    let terrainWall = {
        tl: [(640 - 250)*1.5, (360 + 250)*1.5],
        tr: [(640 + 250)*1.5, (360 + 250)*1.5],
        bl: [(640 - 250)*1.5, (360 - 250)*1.5],
        br: [(640 + 250)*1.5, (360 - 250)*1.5]
    }
    let pathfinder = new Pathfinder(p);

    p.setup = function () {
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
                    smoothedPoses[j].randomId = Math.random();

                    sp = pose;
                    id = j;
                    break;
                }
            }
            if (id < 0) {
                smoothedPoses.push({ pose: pose, disappearCount: 0, bornCount: 0, randomId: Math.random() })
                sp = pose;
                id = smoothedPoses.length - 1;
            }

        }
    }

    p.drawTerrain = function (jsonUi, t) {
        let pg = p.renderPg;
        let terrainAlpha = 255;
        let terrainConnect = 0;
        terrainConnect = jsonUi.sliderValues.terrainAlpha;
        if (jsonUi.sliderValues.terrainAlpha < 0.1) {
            terrainAlpha *= p.map(jsonUi.sliderValues.terrainAlpha, 0, 0.1, 0, 1);
        }
        pg.strokeWeight(2);
        pg.stroke(255);
        let gridN = 12;
        let gridMatrix = [];
        let terrain = {};
        for (let key in terrainBottom) {
            let pl = jsonUi.sliderValues.terrainRot;
            let x = p.lerp(terrainWall[key][0], terrainBottom[key][0], pl);
            let y = p.lerp(terrainWall[key][1], terrainBottom[key][1], pl);
            terrain[key] = [x, y];
        }
        for (let i = 0; i <= gridN; i++) {
            gridMatrix[i] = [];
            for (let j = 0; j <= gridN; j++) {
                let x0 = p.lerp(terrain.tl[0], terrain.tr[0], i / gridN);
                let y0 = p.lerp(terrain.tl[1], terrain.tr[1], i / gridN);
                let x1 = p.lerp(terrain.bl[0], terrain.br[0], i / gridN);
                let y1 = p.lerp(terrain.bl[1], terrain.br[1], i / gridN);
                let x = p.lerp(x0, x1, j / gridN);
                let y = p.lerp(y0, y1, j / gridN);
                let n = p.noise(t * 1 + y * 0.1, x * 0.1);
                let amp = 0;
                amp = jsonUi.sliderValues.terrainNoise;
                y += -amp * EasingFunctions.easeInQuint(n);
                gridMatrix[i][j] = { x: x, y: y };
            }
        }
        pg.stroke(255, terrainAlpha);
        if (terrainConnect == 0) return;
        for (let i = 0; i <= gridN; i++) {
            let l = terrainConnect;
            for (let j = 0; j < gridN; j++) {
                let g0 = gridMatrix[i][j];
                let g1 = gridMatrix[i][j + 1];
                let x1 = p.lerp(g0.x, g1.x, l);
                let y1 = p.lerp(g0.y, g1.y, l);
                pg.line(g0.x, g0.y, x1, y1);

                x1 = p.lerp(g0.x, g1.x, 1 - l);
                y1 = p.lerp(g0.y, g1.y, 1 - l);
                pg.line(g1.x, g1.y, x1, y1);
            }
            for (let j = 0; j < gridN; j++) {
                let g0 = gridMatrix[j][i];
                let g1 = gridMatrix[j + 1][i];
                let x1 = p.lerp(g0.x, g1.x, l);
                let y1 = p.lerp(g0.y, g1.y, l);
                pg.line(g0.x, g0.y, x1, y1);

                x1 = p.lerp(g0.x, g1.x, 1 - l);
                y1 = p.lerp(g0.y, g1.y, 1 - l);
                pg.line(g1.x, g1.y, x1, y1);
            }
        }
    }

    p.draw = function () {
        let t = p.millis() * 0.001;
        let tw = t % 2;
        if (tw > 1) tw = 2 - tw;

        p.fft.analyze();

        let jsonUi = JSON.parse(p.jsonUiString);

        if (jsonUi.sliderValues == undefined) {
            return;
        }

        let showIds = false;
        let showPoints = false;
        let staebeLengths = [0, 0, 0];
        staebeLengths[0] = jsonUi.sliderValues.armLength;
        staebeLengths[1] = jsonUi.sliderValues.legLength;
        staebeLengths[2] = jsonUi.sliderValues.spineLength;
        let lerping = 0.5;

        for (let i = 0; i < smoothedAmps.length; i++) {
            smoothedAmps[i] = p.lerp(smoothedAmps[i], p.fft.spectrum[i], 0.5);
            smoothedAmps[i] = p.lerp(1, smoothedAmps[i], jsonUi.sliderValues.audioReactive);
        }

        for (let i = 0; i < particles.length; i++) {
            particles[i].toUpdate = true;
        }
        let lineColor = { r: 255, g: 255, b: 255 };

        this.lerping = lerping;

        let pg = p.renderPg;
        pg.beginDraw();
        pg.clear();
        pg.textSize(24)
        p.tracking();

        pg.background(0, 0, 0, jsonUi.sliderValues.background);

        pg.strokeWeight(1);
        pg.noFill();
        pg.stroke(0);
        pg.rect(0, 0, pg.width - 1, pg.height - 1);

        pg.pushMatrix();
        pg.scale(p.width / 1920.0, p.height / 1080.0);

        p.drawTerrain(jsonUi, t);

        pathfinder.draw(jsonUi.sliderValues.pathfinder, pg, t);

        pg.strokeWeight(6);
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
            let fadeOut = p.map(smoothedPose.disappearCount, 0, disappearMax, 1, 0);

            pg.noStroke();
            pg.fill(255, fadeIn * fadeOut * 255);
            if (showPoints) {
                for (let j = 0; j < sp.length; j++) {
                    pg.ellipse(sp[j].x, sp[j].y, 5, 5);
                }
            }

            function ofMap(x, a, b, c, d, is) {
                let t = p.map(x, a, b, c, d);
                if (is) {
                    t = p.constrain(t, c, d);
                }
                return t;
            }
            for (let j = 0; j < pairs.length; j++) {
                let staebeType = staebePairToType[j];
                for (let k = trace.length - 1; k >= 0; k--) {
                    let l = staebeLengths[staebeType];

                    let i0 = pairs[j][0];
                    let i1 = pairs[j][1];
                    let xt0 = trace[k][i0].x;
                    let yt0 = trace[k][i0].y;
                    let xt1 = trace[k][i1].x;
                    let yt1 = trace[k][i1].y;

                    if (staebeType == 1) {
                        let i2 = pairs[j][2];
                        let i3 = pairs[j][3];
                        let xt2 = trace[k][i2].x;
                        let yt2 = trace[k][i2].y;
                        let xt3 = trace[k][i3].x;
                        let yt3 = trace[k][i3].y;

                        let dAx = xt1 - xt0;
                        let dAy = yt1 - yt0;
                        let dBx = xt3 - xt2;
                        let dBy = yt3 - yt2;
                        let angle = Math.atan2(dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy);
                        angle = Math.abs(angle);
                        l *= ofMap(angle, Math.PI * 0.125, Math.PI * 0.5, 0, 1.5, true);
                    }

                    if (isNaN(xt0) || isNaN(yt0) || isNaN(xt1) || isNaN(yt1)) {
                        continue;
                    }
                    let alpha = fadeIn * fadeOut * 255;
                    if (l < 0.1) {
                        alpha *= l * 10;
                    }
                    alpha *= (k / trace.length);
                    pg.stroke(lineColor.r, lineColor.g, lineColor.b, alpha);

                    let xt2 = p.lerp(xt1, xt0, l);
                    let yt2 = p.lerp(yt1, yt0, l);

                    let particleIndex = Math.floor(smoothedPose.randomId * particles.length + j) % particles.length;
                    let pt = particles[particleIndex];
                    pt.update(l);
                    let xp2 = pt.x0;
                    let yp2 = pt.y0;
                    let xp1 = pt.x1;
                    let yp1 = pt.y1;

                    let particleLerp = 0;
                    particleLerp = ofMap(jsonUi.sliderValues.wander, particleIndex / particles.length * 0.5, particleIndex / particles.length * 0.5 + 0.5, 0, 1, true);
                    particleLerp = EasingFunctions.easeInOutCubic(particleLerp);

                    let x2 = p.lerp(xt2, xp2, particleLerp);
                    let y2 = p.lerp(yt2, yp2, particleLerp);
                    let x1 = p.lerp(xt1, xp1, particleLerp);
                    let y1 = p.lerp(yt1, yp1, particleLerp);
                    pg.line(x2, y2, x1, y1);
                    break;
                }
            }
            pg.popStyle();
        }
        pg.popMatrix();
        pg.endDraw();
    }
};

var p001 = new p5(s);