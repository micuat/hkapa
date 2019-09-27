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

    p.setup = function () {
        p.createCanvas(1280, 720);
        p.frameRate(30);
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

        let showIds = true;
        let showPoints = false;
        let drawStaebe = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let staebeLength = 2;
        let staebeLfo = false;
        let staebeLineFade = true;
        let showTrace = true;
        let lerping = 0.5;

        this.lerping = lerping;

        p.background(0)
        p.textSize(24)
        p.tracking();

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
                        p.text(i + "," + smoothedPose.bornCount, sp[j].x, sp[j].y - 50);
                        break;
                    }
                }
            }

            p.pushStyle();
            let fadeIn = Math.min(1, smoothedPose.bornCount * 0.05);
            p.noStroke();
            p.fill(255, fadeIn * 255);
            if (showPoints) {
                for (let j = 0; j < sp.length; j++) {
                    p.ellipse(sp[j].x, sp[j].y, 5, 5);
                }
            }
            for (let k = 0; k < trace.length; k++) {
                if (showTrace == false && k != trace.length - 1) {
                    continue;
                }
                let ktw = EasingFunctions.easeInOutCubic(k / trace.length);
                p.stroke(255, fadeIn * 255);

                let l = staebeLength;
                if (staebeLineFade) {
                    l *= ktw;
                }
                if (staebeLfo) {
                    l = l * EasingFunctions.easeOutCubic(tw);
                }
                for (let j = 0; j < pairs.length; j++) {
                    if (drawStaebe.indexOf(j) >= 0) {
                        let i0 = pairs[j][0];
                        let i1 = pairs[j][1];
                        let x0 = trace[k][i0].x;
                        let y0 = trace[k][i0].y;
                        let x1 = trace[k][i1].x;
                        let y1 = trace[k][i1].y;
                        let x2 = p.lerp(x1, x0, l);
                        let y2 = p.lerp(y1, y0, l);
                        p.line(x2, y2, x1, y1);
                    }
                }
            }
            p.popStyle();
        }
    }
};

var p001 = new p5(s);