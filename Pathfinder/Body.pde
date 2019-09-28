class Body {

  MeshElement[] element=new MeshElement[0];

  public Body() {
  }

  public Body copy(Body source) {
    return new Body(this);
  }

  public Body(Body source) {
    element = new MeshElement[0];

    for (int i = 0; i < source.element.length; i++) {
      boolean found = false;
      for (int j = 0; j < element.length; j++) {
        if (i != j) {
          if (m.compareMesh(source.element[i].mesh, element[j].mesh)) { 
            found = true; 
            println("yes-------------------------------------");
          } else ;
        }
      }
      if (!found)
        element = (MeshElement[])append(element, new MeshElement(source.element[i].mesh));
    }
  }

  public Body(PFace face) {
    element = new MeshElement[0];
    addFace(face);
  }

  public Body(PMesh mesh) {
    element = new MeshElement[0];
    for (int i = 0; i < mesh.faces.length; i++) {
      addFace(mesh.faces[i]);
    }
  }

  public Body(PFace[] faces) {
    element = new MeshElement[0];
    for (int i = 0; i < faces.length; i++) {
      addFace(faces[i]);
    }
  }

  public void addFace(PFace face) {
    WETriangleMesh meshI = new WETriangleMesh();
    PVector[] v = face.vert;
    Vec3D a = new Vec3D(v[0].x, v[0].y, v[0].z);
    Vec3D b = new Vec3D(v[1].x, v[1].y, v[1].z);
    Vec3D c = new Vec3D(v[2].x, v[2].y, v[2].z);
    Vec3D d = new Vec3D(v[3].x, v[3].y, v[3].z);

    meshI.addFace(a, b, c);
    meshI.addFace(c, d, a);
    element = (MeshElement[])append(element, new MeshElement(meshI));
  }

  public boolean duplicateCheck(WETriangleMesh mesh) {
    float[] a = mesh.getUniqueVerticesAsArray();
    Vec3D[] posOld = new Vec3D[4];

    if (a.length / 3 == 3) {
      for (int i = 0; i < 3; i++) {
        posOld[i] = new Vec3D(a[i*3], a[i*3+1], a[i*3+2]);
      }
      posOld[3] = new Vec3D((posOld[0].x+posOld[2].x) / 2, (posOld[0].y+posOld[2].y) / 2, (posOld[0].z+posOld[2].z) / 2);
      mesh.clear();
      mesh.addFace(posOld[0], posOld[1], posOld[2]);
      mesh.addFace(posOld[2], posOld[3], posOld[0]);
    }
    return true;
  }

  // The HEMESH Body Transformer
  public Body(HE_Mesh meshI) {
    element = new MeshElement[0];

    int count = 0;
    Iterator<HE_Face> iter = meshI.fItr();
    for (int i = 0; iter.hasNext(); i++) {
      HE_Face f = iter.next();
      count++;
      if (count % 1 == 0) {
        final List<WB_IndexedTriangle2D> tris = f.triangulate();
        final List<HE_Vertex> vertices = f.getFaceVertices();
        WB_Point3d v0, v1, v2;
        WB_IndexedTriangle2D tri;
        WETriangleMesh mesh = new WETriangleMesh();
        for (int ind = 0; ind < tris.size(); ind++) {
          tri = tris.get(ind);

          v0 = vertices.get(tri.i1);
          v1 = vertices.get(tri.i2);
          v2 = vertices.get(tri.i3);

          Vec3D a = new Vec3D((float)v0.x, (float)v0.y, (float)v0.z);
          Vec3D b = new Vec3D((float)v1.x, (float)v1.y, (float)v1.z);
          Vec3D c = new Vec3D((float)v2.x, (float)v2.y, (float)v2.z);
          Vec3D d = new Vec3D((float)(c.x+a.x)/2, (float)(c.y+a.y)/2, (float)(c.z+a.z)/2);

          mesh.addFace(a, b, c);
          mesh.addFace(c, d, a);
          element = (MeshElement[])append(element, new MeshElement(mesh));
        }
      }
    }
  }

  public void draw(color colorI, boolean debug, boolean drawGrid) {
    for (int i = 0; i < element.length; i++) {
      element[i].draw(colorI, debug, drawGrid);
    }
  }
}