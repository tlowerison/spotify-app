import sys, pika, os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from sklearn import svm
from sklearn.decomposition import PCA
from sklearn.externals import joblib
from os.path import join, dirname
from dotenv import load_dotenv

class Model:
	def __init__(self, pcaPath, clfPath, pngPath):
		self.pcaPath = pcaPath
		self.clfPath = clfPath
		self.pngPath = pngPath
		self.plotX = (-1.5, 1.5)
		self.plotY = (-1.5, 1.5)
		self.xx, self.yy = np.meshgrid(np.linspace(self.plotX[0], self.plotX[1], 200), np.linspace(self.plotY[0], self.plotY[1], 200))
		self.methods = {
			"train": self.train,
			"test": self.test
		}

	def train(self, data, nu=0.25, gamma=5):
		self.pca = PCA(n_components=2)
		self.X_train = self.pca.fit_transform(np.array(data))

		self.clf = svm.OneClassSVM(nu=nu, kernel="rbf", gamma=gamma)
		self.clf.fit(self.X_train)
		self.y_pred_train = self.clf.predict(self.X_train)
		sys.stdout.write("model trained\n")

	def test(self, data):
		self.pca = joblib.load(self.pcaPath)
		self.clf = joblib.load(self.clfPath)

		self.X_test = self.pca.transform(np.array(data))
		self.y_pred_test = self.clf.predict(self.X_test)
		sys.stdout.write("model tested\n")

	def plot(self, method, levels=10):
		X = self.X_train if method == "train" else self.X_test
		Z = self.clf.decision_function(np.c_[self.xx.ravel(), self.yy.ravel()]).reshape(self.xx.shape)

		plt.contourf(self.xx, self.yy, Z, levels=np.linspace(Z.min(), 0, levels), cmap=plt.get_cmap("inferno"))
		a = plt.contour(self.xx, self.yy, Z, levels=[0], linewidths=2, colors="palevioletred")
		b = plt.scatter(X[:, 0], X[:, 1], c="orange", s=15, edgecolors="black")

		plt.axis("tight")
		plt.xticks([])
		plt.yticks([])
		plt.xlim(self.plotX)
		plt.ylim(self.plotY)

		leg = plt.legend([a.collections[0], b],
			["Learned Frontier", "Training Observations"],
			loc="lower left", prop=fm.FontProperties(size=9))
		for text in leg.get_texts():
			text.set_color("white")
			sys.stdout.write("model plotted\n")

	def show(self):
		plt.show()

	def save(self, savePKL=False, savePNG=True):
		if savePKL:
			joblib.dump(self.pca, self.pcaPath)
			joblib.dump(self.clf, self.clfPath)

			sys.stdout.write("PCA Path: " + self.pcaPath + "\n")
			sys.stdout.write("PCA Size: " + str(os.stat(self.pcaPath).st_size) + "\n")
			sys.stdout.write("CLF Path: " + self.clfPath + "\n")
			sys.stdout.write("CLF Size: " + str(os.stat(self.clfPath).st_size) + "\n")
		if savePNG:
			plt.savefig(self.pngPath, bbox_inches="tight")
			sys.stdout.write("PNG Path: " + self.pngPath + "\n")
			sys.stdout.write("PNG Size: " + str(os.stat(self.pngPath).st_size) + "\n")
		sys.stdout.write("model saved\n")

	def close(self):
		plt.close()
		sys.stdout.write("model closed\n")

# TASK CONSUMER

dotenv_path = join(dirname(__file__), ".env")
load_dotenv(dotenv_path)
CLOUDAMQP_URL = os.environ.get("CLOUDAMQP_URL")

connection = pika.BlockingConnection(pika.connection.URLParameters(CLOUDAMQP_URL))
channel = connection.channel()

channel.queue_declare(queue="tasks", durable=True)

def callback(ch, method, properties, body):
	sys.stdout.write("CONSUMING TASK\n")
	lines = body.decode("utf-8").split("\n")

	modelId = lines[0]
	modelMethod = lines[1]
	pcaPath = lines[2]
	clfPath = lines[3]
	pngPath = lines[4]
	data = eval(lines[5])
	model = Model(pcaPath, clfPath, pngPath)
	status = ""
	try:
		model.methods[modelMethod](data)
		model.plot(modelMethod, levels=64)
		model.save(savePKL=(modelMethod=="train"))
		status = "success"
	except Exception as err:
		sys.stdout.write("Model Error!\n")
		sys.stdout.write(err)
		sys.stdout.write("\n")
		status = "error"
		
	callback_prologue(ch, method, model, modelId, status)

def callback_prologue(ch, method, model, id, status):
	model.close()
	sys.stdout.write("PUBLISHING STATUS\n")
	channel.basic_publish(exchange="", routing_key="status", body="{\"id\": \"" + id + "\",\"status\": \"" + status + "\"}")
	sys.stdout.flush()
	ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(callback, queue="tasks")

# STATUS PUBLISHER
channel.queue_declare(queue="status", durable=True)
sys.stdout.write("ready!\n")
sys.stdout.flush()

channel.start_consuming()
