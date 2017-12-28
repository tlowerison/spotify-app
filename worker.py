import sys
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from sklearn import svm
from sklearn.decomposition import PCA
from sklearn.externals import joblib

plotX = (-1.5, 1.5)
plotY = (-1.5, 1.5)
xx, yy = np.meshgrid(np.linspace(plotX[0], plotX[1], 200), np.linspace(plotY[0], plotY[1], 200))

pcaPath = ""
clfPath = ""
pngPath = ""

class Model:
	def train(self, data, nu=0.25, gamma=5):
		self.pca = PCA(n_components=2)
		self.X_train = self.pca.fit_transform(np.array(data))

		self.clf = svm.OneClassSVM(nu=nu, kernel="rbf", gamma=gamma)
		self.clf.fit(self.X_train)
		self.y_pred_train = self.clf.predict(self.X_train)
		print("trained")

	def test(self, data):
		self.pca = joblib.load(pcaPath)
		self.clf = joblib.load(clfPath)

		self.X_test = self.pca.transform(np.array(data))
		self.y_pred_test = self.clf.predict(self.X_test)
		print("tested")

	def plot(self, method, levels=10):
		X = self.X_train if method == "train" else self.X_test
		Z = self.clf.decision_function(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)

		plt.contourf(xx, yy, Z, levels=np.linspace(Z.min(), 0, levels), cmap=plt.get_cmap("inferno"))
		a = plt.contour(xx, yy, Z, levels=[0], linewidths=2, colors="palevioletred")
		b = plt.scatter(X[:, 0], X[:, 1], c="orange", s=15, edgecolors="black")

		plt.axis("tight")
		plt.xticks([])
		plt.yticks([])
		plt.xlim(plotX)
		plt.ylim(plotY)

		leg = plt.legend([a.collections[0], b],
			["Learned Frontier", "Training Observations"],
			loc="lower left", prop=fm.FontProperties(size=9))
		for text in leg.get_texts():
			text.set_color("white")
			print("plotted")

	def show(self):
		plt.show()

	def save(self):
		joblib.dump(self.pca, pcaPath)
		joblib.dump(self.clf, clfPath)
		plt.savefig(pngPath, bbox_inches="tight")
		print("saved")

#start process
if __name__ == "__main__":
	print("python")
	lines = sys.stdin.readlines()
	print("lines")
	method = lines[0][:len(lines[0]) - 1]
	pcaPath = lines[1][:len(lines[1]) - 1]
	clfPath = lines[2][:len(lines[2]) - 1]
	pngPath = lines[3][:len(lines[3]) - 1]
	data = eval(lines[4])
	print(method)
	print(pcaPath)
	print(clfPath)
	print(pngPath)
	print(data)
	model = Model()
	if method == "train":
		model.train(data)
	elif method == "test":
		model.test(data)
	elif method == "unit_test":
		unit_test(model)
	model.plot(method, levels=64)
	model.save()
