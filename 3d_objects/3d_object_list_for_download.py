Allow users to upload their 3d objects and save the paths either on the internet or on this github. We need later to sync to our server. 

or a list that we can write into a script to make it downloadable from link.
example: [https://www.roboticsplatforms.com/digital_twin/objectfile.glb, object_name, https://www.roboticsplatforms.com/digital_twin/objectfile.glb, https://www.roboticsplatforms.com/digital_twin/objectfile.glb, object_name]

when developing locally on your own computer with flask and js you paths are going to look like: [www.localhost/5000/3d_object, object_name].

pseudo code:
@app.route
upload2dobject(3dobject{x}):
allow user to upload the object through a flask route that recieves it from the client and saves locally on your computer. then we deploy on the server and allow user to upload their 3d objects to it.

