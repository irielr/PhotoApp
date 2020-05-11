var app = {
	inicio: function() {
		this.iniciarFastClick();
		this.iniciarBotones();
		//this.bindEvents()
	},
		
	iniciarFastClick: function(){
		FastClick.attach(document.body);
	},
		
	bindEvents: function() {
		document.addEventListener('deviceready', app.iniciarBotones, false);
        document.addEventListener('pause', app.onPause, false);
        document.addEventListener('resume', app.onResume, false);
	},

	onPause: function() { // función que se lanza cuando la app pasa al background al ejecutar una actividad nativa	
		document.body.className = 'oscuro';
        // Si se está tomando una foto, se guardará el estado del pluggin para retornarlo en onResume(). 
		// En tal caso también se guardará temporalmente la imagen tomada.
        if(appState.takingPicture || appState.imageUri) {
            window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appState));
        };
    },
	
    onResume: function(event) { // función que se lanza cuando la app se restablece luego de ejecutar una actividad nativa
        // Primero se verifica el estado de la app. 
		// Luego se ejecuta desde la parte del código que hizo la llamada al pluggin y carga los argumentos relevantes.
        var storedState = window.localStorage.getItem(APP_STORAGE_KEY);
        if(storedState) { appState = JSON.parse(storedState); };

        // Chequea si necesitamos restaurar alguna imagen tomada
        if(!appState.takingPicture && appState.imageUri) { this.fotoTomada(appState.imageUri); }
        else {
			if(appState.takingPicture && event.pendingResult) { 
				// Chequear si hubo algún result del pluggin (se requiere cordova-android 5.1.0+)
				if(event.pendingResult.pluginStatus === "OK") { cameraSuccessCallback(event.pendingResult.result); } 
				else { cameraFailureCallback(event.pendingResult.result); };
			};
		};
    },
	
	iniciarBotones: function() {
		var buttonAction = document.querySelector('#button-action');
		buttonAction.addEventListener('click', function(){ app.tomarFoto(Camera.PictureSourceType.CAMERA);});
		
		var filterButtons = document.querySelectorAll('.button-filter');
		filterButtons[0].addEventListener('click', function(){app.aplicarFiltro('gray');});
		filterButtons[1].addEventListener('click', function(){app.aplicarFiltro('negative');});
		filterButtons[2].addEventListener('click', function(){app.aplicarFiltro('sepia');});

		var buttonGallery = document.querySelector("#button-gallery");
		buttonGallery.addEventListener('click', function(){ app.tomarFoto(Camera.PictureSourceType.PHOTOLIBRARY); });
	},

	tomarFoto: function(picSourceType){
		//appState.takingPicture = true;
		// Accedo al dispositivo mediante el pluggin de la cámara en el Córdoba
		var opciones = {
				  quality: 100,
				  sourceType: picSourceType,
				  destinationType: Camera.DestinationType.FILE_URI,
				  targetWidth: 300,
				  targetHeight: 300,
				  correctOrientation: true
				};
		navigator.camera.getPicture(app.fotoCargada, app.errorAlCargarFoto, opciones);
	},

	fotoCargada: function(imageURI) {
		var img = document.createElement('img');
		img.src = imageURI;
		img.onload = function(){ app.pintarFoto(img); };
		//appState.takingPicture = false;
	},

	pintarFoto: function(img) {
		imgCanvas.width = img.width;
		imgCanvas.height = img.height;
		context.drawImage(img, 0, 0, img.width, img.height);
	},

	errorAlCargarFoto: function(message) {
		console.log('Fallo al tomar foto o toma cancelada: ' + message);
	},

	aplicarFiltro: function(filterName) {
		var imageData;
		imageData = context.getImageData(0, 0, imgCanvas.width, imgCanvas.height);
		effects[filterName](imageData.data);
		context.putImageData(imageData, 0, 0);
	}
};

var imgCanvas = document.querySelector('#foto');
var context = imgCanvas.getContext('2d');

if ('addEventListener' in document) {
	document.addEventListener('DOMContentLoaded', function() { app.iniciarFastClick(); }, false);
	document.addEventListener('deviceready', app.iniciarBotones(), false);
};