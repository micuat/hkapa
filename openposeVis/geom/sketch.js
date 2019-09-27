var s = function (p) {
    let pairs = [[3, 4],
    [6, 7],
    [2, 3],
    [5, 6],
    [2, 9],
    [5, 12],
    [9, 10],
    [12, 13],
    ];

    p.setup = function () {
        p.createCanvas(1280, 720);
        p.frameRate(30);
    }

    function unpackPose (pose) {
        let joints = [];
        for (let j = 0; j < pose.length; j += 3) {
            let x = pose[j];
            let y = pose[j + 1];
            if(x == 0) x = undefined;
            if(y == 0) y = undefined;
            let joint = {x: x, y: y}
            joints.push(joint);
        }
        return joints;
    }
    p.draw = function () {
        p.background(0)
        let poses = JSON.parse("{" + p.jsonString + "}");
        if(poses.people == undefined) return;
        let people = poses.people;
        for (let i = 0; i < people.length; i++) {
            let pose = unpackPose(people[i].pose_keypoints_2d);
            p.text(" " + i, pose[0].x, pose[0].y - 50);
            for (let j = 0; j < pose.length; j++) {
                p.ellipse(pose[j].x, pose[j].y, 5, 5);
            }
            for (let j = 0; j < pairs.length; j++) {
                let i0 = pairs[j][0];
                let i1 = pairs[j][1];
                p.line(pose[i0].x, pose[i0].y, pose[i1].x, pose[i1].y);
            }
        }
    }
};

var p001 = new p5(s);