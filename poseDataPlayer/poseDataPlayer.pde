import netP5.*;
import oscP5.*;

OscP5 oscP5;
NetAddress myRemoteLocation;

//int numFiles = 9;
int numFiles = 968;
String [] jsonStrings = new String[numFiles];

void setup() {
  for (int i = 0; i < numFiles; i++) {
    String[] ss = loadStrings(str(i) + ".json");
    String s = "";
    for (int j = 0; j < ss.length; j++) {
      s += ss[j].trim();
    }
    jsonStrings[i] = s;
  }

  frameRate(15);
  oscP5 = new OscP5(this, 12000);
  myRemoteLocation = new NetAddress("127.0.0.1", 13000);
}

void draw() {
  int index = frameCount % numFiles;
  OscMessage myMessage = new OscMessage("/openpose/poses");
  //JSONObject jo = parseJSONObject("{"+jsonStrings[index]+"}");
  //myMessage.add(jo.toString());
  myMessage.add(jsonStrings[index]);
  oscP5.send(myMessage, myRemoteLocation);
}
