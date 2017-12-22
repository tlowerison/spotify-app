import sys, json
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from sklearn import svm
from sklearn.decomposition import PCA
from sklearn.externals import joblib
import seaborn as sns
import pickle

scale = 10
plotX = (-1.5 * scale, 1.5 * scale)
plotY = (-1.5 * scale, 1.5 * scale)
sns.set(style="dark")
gamma_weight = 3
nu_weight = 1
cmap = sns.cubehelix_palette(8, start=.5, rot=-.75, as_cmap=True, reverse=True)
xx, yy = np.meshgrid(np.linspace(plotX[0], plotX[1], 200), np.linspace(plotY[0], plotY[1], 200))
#matplotlib.rcParams['toolbar'] = 'None'

class Model:
	def __init__(self, levels=10):
		self.pca = None
		self.clf = None
		self.levels = levels

	def train(self, data, nu=0.1410693416765024, gamma=0.5164035329677892):
		self.pca = PCA(n_components=2)
		self.X_train = self.pca.fit_transform(np.array(data) * scale)

		self.clf = svm.OneClassSVM(nu=nu, kernel="rbf", gamma=gamma)
		self.clf.fit(self.X_train)
		self.y_pred_train = self.clf.predict(self.X_train)
		joblib.dump(self.pca, 'pca.pkl')
		joblib.dump(self.clf, 'clf.pkl')

	def test(self, data):
		self.pca = joblib.load('pca.pkl')
		self.clf = joblib.load('clf.pkl')

		self.X_test = self.pca.transform(np.array(data) * scale)
		self.y_pred_test = self.clf.predict(self.X_test)

	def plot(self, method, title=""):
		X = self.X_train if method == "Training" else self.X_test
		Z = self.clf.decision_function(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)

		plt.contourf(xx, yy, Z, levels=np.linspace(Z.min(), 0, self.levels), cmap=cmap)
		a = plt.contour(xx, yy, Z, levels=[0], linewidths=2, colors='palevioletred')
		b = plt.scatter(X[:, 0], X[:, 1], c='orange', s=15, edgecolors='black')

		plt.axis('tight')
		plt.xticks([])
		plt.yticks([])
		plt.xlim(plotX)
		plt.ylim(plotY)

		leg = plt.legend([a.collections[0], b],
			["Learned Frontier", "Training Observations"],
			loc="lower left",
			prop=fm.FontProperties(size=9))
		for text in leg.get_texts():
			text.set_color("white")

		if method == "Training":
			n_error_train = self.y_pred_train[self.y_pred_train == -1].size
			plt.xlabel("Training Error: %d/%d" % (n_error_train, self.y_pred_train.size))
		else:
			n_success_test = self.y_pred_test[self.y_pred_test == 1].size
			plt.xlabel("Testing Success: %d/%d" % (n_success_test, self.y_pred_test.size))

		plt.title("Model " + method if not title else title)
		plt.show()

def unit_test(model):
	random_feature_generators = [
		lambda: np.random.random_sample((1000, 1)),
		lambda: np.random.random_sample((1000, 1)),
		lambda: np.random.random_sample((1000, 1)),
		lambda: np.random.random_sample((1000, 1)),
		lambda: np.random.random_sample((1000, 1)),
		lambda: np.random.random_sample((1000, 1)),
		lambda: np.random.random_sample((1000, 1)),
		lambda: np.random.random_sample((1000, 1)),
		lambda: np.random.random_sample((1000, 1)),
		lambda: np.random.random_integers(1, 7, (1000, 1)) / 4,
		lambda: np.random.random_sample((1000, 1))
	]
	titles = [
		"Danceability",
		"Energy",
		"Loudness",
		"Speechiness",
		"Acousticness",
		"Instrumentalness",
		"Liveness",
		"Valence",
		"Tempo",
		"Time Signature",
		"Popularity"
	]
	null_feature_generator = lambda: np.zeros((1000, 1))
	def test_1():
		a = np.concatenate([random_feature_generators[i]() for i in range(11)], 1)
		model.test(a)
		model.plot("Testing", "Model Unit Test: Gaussian Noise")

	def test_2():
		for i in range(11):
			a = np.concatenate([random_feature_generators[i]() if j == i else null_feature_generator() for j in range(11)], 1)
			model.test(a)
			model.plot("Testing", "PCA: Gaussian Noise Confined to " + titles[i] + "-Space")

	test_1()
	#test_2()

#start process
if __name__ == '__main__':
	lines = sys.stdin.readlines()
	process = lines[0][:len(lines[0]) - 1]
	data = json.loads(lines[1])
	model = Model(levels=100)
	if process == 'train':
		model.train(data)
		model.plot("Training")
	elif process == 'test':
		model.test(data)
		model.plot("Testing")
	elif process == 'unit_test':
		unit_test(model)
