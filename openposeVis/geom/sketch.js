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
    p.draw = function () {
        p.background(0)
        p.textSize(24)
        let poses = JSON.parse("{" + p.jsonString + "}");
        if (poses.people == undefined) return;
        let peopleRaw = poses.people;
        let people = [];
        for (let i = 0; i < peopleRaw.length; i++) {
            people.push({ pose: unpackPose(peopleRaw[i].pose_keypoints_2d), taken: false });
        }

        let maxError = 100;
        let disappearMax = 15;
        for (let i = 0; i < smoothedPoses.length; i++) {
            let sp = smoothedPoses[i].pose;
            if (smoothedPoses[i].disappearCount >= disappearMax) {
                continue;
            }
            let id = -1;
            let errors = [];
            // find errors
            for (let j = 0; j < people.length; j++) {
                let pose = people[j].pose;
                if (people[j].taken == true) {
                    errors.push(maxError);
                    continue;
                }
                let error = 0;
                let validCount = 0;
                for (let k = 0; k < pose.length; k++) {
                    let x0 = pose[k].x;
                    let y0 = pose[k].y;
                    let x1 = sp[k].x;
                    let y1 = sp[k].y;
                    if (isNaN(x0) || isNaN(y0) || isNaN(x1) || isNaN(y1)) {
                    }
                    else {
                        error += p.dist(x0, y0, x1, y1);
                        validCount++;
                    }
                }
                if (validCount > 5) {
                    errors.push(error / validCount);
                }
                else {
                    errors.push(maxError);
                }
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
                p.text(i + "," + smoothedPoses[i].bornCount, sp[0].x, sp[0].y - 50);

                p.pushStyle();
                let fadeIn = Math.min(1, smoothedPoses[i].bornCount * 0.05);
                p.stroke(255, fadeIn * 255);
                p.fill(255, fadeIn * 255);
                for (let j = 0; j < sp.length; j++) {
                    if (isNaN(sp[j].x) || isNaN(sp[j].y)) {
                        sp[j].x = pose[j].x;
                        sp[j].y = pose[j].y;
                    }
                    else {
                        sp[j].x = p.lerp(sp[j].x, pose[j].x, 0.5);
                        sp[j].y = p.lerp(sp[j].y, pose[j].y, 0.5);
                    }
                    p.ellipse(sp[j].x, sp[j].y, 5, 5);
                }
                for (let j = 0; j < pairs.length; j++) {
                    let i0 = pairs[j][0];
                    let i1 = pairs[j][1];
                    let x0 = sp[i0].x;
                    let y0 = sp[i0].y;
                    let x1 = sp[i1].x;
                    let y1 = sp[i1].y;
                    let x2 = p.lerp(x1, x0, 5);
                    let y2 = p.lerp(y1, y0, 5);
                    p.line(x2, y2, x1, y1);
                }
                p.popStyle();
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
};

var p001 = new p5(s);