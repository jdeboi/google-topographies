function handleBrowseClick() {
    var fileinput = document.getElementById("browse");
    fileinput.click();
}
function showInstructions() {
    document.getElementById("instructions").style.display = "block";
    document.getElementById("landingPage").style.display = "none";
}
// function showLoading() {
//     document.getElementById("instructions").style.display = "none";
//     document.getElementById("loading").style.display = "block";
// }
function showMaps() {
    document.getElementById("header").style.display = "none";
    document.getElementById("mapContainer").style.display = "block";
    document.getElementById("navMap").style.display = "block";
    document.getElementById("mainNav").classList.add('dark');

    document.getElementById("socials").classList.add('dark');
    // for picture taking
    // document.getElementById("mainNav").style.display = "none";
    // document.getElementById("navMap").style.display = "none";
}

function setDevDom() {
    document.getElementById("header").style.display = "none";
    document.getElementById("navMap").style.display = "block";
    document.getElementById("mapContainer").style.display = "block";
}

function showLoading() {
    document.getElementById("header").style.display = "none";
    document.getElementById("loading").style.display = "block";
    document.getElementById("navMap").style.pointerEvents = "none";
}

function hideLoading() {
    document.getElementById("loading").style.display = "none";
    document.getElementById("navMap").style.pointerEvents = "all";
}