# Noise Injection & Spotify User Modelling Application
Developed by Trey Lowerison<br />
<br />
Stack: MongoDB Express AngularJS Node.js Python<br />
<br />
Only supported for local use right now.<br />
Download or clone down, then open a terminal in the folder.<br />
Run:<br />
npm install<br />
npm start<br /><br />
Next, open in your browser http://localhost:5000<br />
The app provides basic feature analysis on your Saved Tracks, Saved Albums, Playlists and Recent Tracks.<br />
If you click "User Model", a Python script will run and build a model of your music preferences! The plot's x and y axes do not have a set meaning as the original plot has 12 dimensions representing the 12 song features used to build the model, but if you test your Discover Weekly against the model you can see how well it predicts Spotify's reccomendation engine!<br />
