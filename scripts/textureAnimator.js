function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) {	
	this.tilesHorizontal = tilesHoriz;
	this.tilesVertical = tilesVert;
	this.numberOfTiles = numTiles;

	texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
	texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

	this.tileDisplayDuration = tileDispDuration;
	this.currentDisplayTime = 0;
	this.currentTile = 0;
	this.update = function( milliSec ) {
		this.currentDisplayTime += milliSec;
		while (this.currentDisplayTime > this.tileDisplayDuration)
			{
				this.currentDisplayTime -= this.tileDisplayDuration;
				this.currentTile++;
				if (this.currentTile == this.numberOfTiles)
					this.currentTile = 0;
				var currentColumn = this.currentTile % this.tilesHorizontal;
				texture.offset.x = currentColumn / this.tilesHorizontal;
				var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
				texture.offset.y = currentRow / this.tilesVertical;
			}
	};
}	

