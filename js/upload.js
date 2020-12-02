
function uploadFile() {
  var promise = new Promise(function(resolve, reject) {
    // do a thing, possibly async, then…
    var x = document.getElementById("myFile");
    if (x.files.length == 0) {
      reject(Error("no file uploaded"));
    }
    else if (x.files[0].name != "Location History.json") {
      reject(Error("file should be named Location History.json"));
    }
    else {
      let file = x.files[0];
      var reader = new FileReader();

      reader.readAsText(file);
      reader.onload = function() {
          json = JSON.parse(reader.result);
          resolve(json);
      };
      reader.onerror = function() {
        reject(Error(reader.error));
      };
    }
  });
  return promise;
}

function getIndex(json) {
  let points = [];
  for (let i = 0; i < json.locations.length; i++){
    let lat = json.locations[i].latitudeE7/ 10000000.0;
    let lon = json.locations[i].longitudeE7/ 10000000.0;
    points.push([lon, lat ]);
  }
  let kdIndex = new KDBush(points);
  return kdIndex;
}
