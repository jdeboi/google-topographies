function handleBrowseClick() {
    console.log("clicking");
    var fileinput = document.getElementById("browse");
    fileinput.click();
}

function showInstructions() {
    document.getElementById("instructions").style.display = "block";
    document.getElementById("landingPage").style.display = "none";
}

function showMaps() {
    document.getElementById("header").style.display = "none";
    document.getElementById("mapContainer").style.display = "block";
    document.getElementById("mainNav").classList.add('dark');
    document.getElementById("navMap").style.display = "block";

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
    document.getElementById("info").style.display = "block";
}

function hideLoading() {
    document.getElementById("loading").style.display = "none";
    document.getElementById("navMap").style.pointerEvents = "all";
}

function toggleFAQ() {
    $('#faqModal').modal('toggle');
}