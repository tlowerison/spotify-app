# Noise Injection & Spotify User Modelling Application
Developed by Trey Lowerison<br />
<br />
Stack: MongoDB Express AngularJS Node.js Python Scikit-Learn<br />
<br />
Only supported for local use right now.<br />
Download or clone down, then open a terminal in the folder.<br />
Run:<br />
npm install<br />
npm start<br />
<br />
Next, open in your browser http://localhost:5000<br />
The app provides basic feature analysis on your Saved Tracks, Saved Albums, Playlists and Recent Tracks.<br />
If you click "User Model", a Python script will run and build a model of your music preferences.<br />

The model is generated by first performing a Principal Component Analysis (PCA) on the training dataset (each sample represents a track and features are provided by Spotify's /audio-features endpoint). We designate the PCA to reduce the features from 12 to 2 so that the model's decision function can be displayed with a gradient plot. After the dimensionality reduction is performed, the model is trained using a One Class Support Vector Machine. We can then further test other datasets (playlists, albums, individual songs, etc.) against our trained model. A unit test is provided where we can see a PCA reduced 12-Variate Gaussian Distribution plotted against our model. These points don't represent particular songs, but give a notion of what a distribution over features looks like. Testing your Decision Weekly playlist, a curated playlist by Spotify for each individual listener, is the best way to benchmark the model against Spotify's own recommendation engines.<br />
