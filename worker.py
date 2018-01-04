import sys, pika, os, base64, io
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
import mpld3

# SVM MODEL
class Model:
	def __init__(self, pcaPath, clfPath):
		self.pcaPath = pcaPath
		self.clfPath = clfPath
		self.plotX = (-1.5, 1.5)
		self.plotY = (-1.5, 1.5)
		self.xx, self.yy = np.meshgrid(np.linspace(self.plotX[0], self.plotX[1], 100), np.linspace(self.plotY[0], self.plotY[1], 100))
		self.methods = {
			"train": self.train,
			"test": self.test
		}

	def train(self, samples, nu=0.25, gamma=5):
		self.pca = PCA(n_components=2)
		self.X_train = self.pca.fit_transform(np.array(samples))

		self.clf = svm.OneClassSVM(nu=nu, kernel="rbf", gamma=gamma)
		self.clf.fit(self.X_train)
		self.y_pred_train = self.clf.predict(self.X_train)
		sys.stdout.write("model trained\n")

	def test(self, samples):
		self.pca = joblib.load(self.pcaPath)
		self.clf = joblib.load(self.clfPath)

		self.X_test = self.pca.transform(np.array(samples))
		self.y_pred_test = self.clf.predict(self.X_test)
		sys.stdout.write("model tested\n")

	def plot(self, method, labels, levels=10):
		X = self.X_train if method == "train" else self.X_test
		Z = self.clf.decision_function(np.c_[self.xx.ravel(), self.yy.ravel()]).reshape(self.xx.shape)

		plt.contourf(self.xx, self.yy, Z, levels=np.linspace(Z.min(), 0, levels), cmap=plt.get_cmap("inferno"))
		contour = plt.contour(self.xx, self.yy, Z, levels=[0], linewidths=2, colors="palevioletred")
		scatter = plt.scatter(X[:, 0], X[:, 1], c="orange", s=15, edgecolors="black")

		self.decision_function = Z.flatten().tolist()
		self.scatter = X.tolist()

		plt.axis("tight")
		plt.xticks([])
		plt.yticks([])
		plt.xlim(self.plotX)
		plt.ylim(self.plotY)

		leg = plt.legend([contour.collections[0], scatter],
			["Learned Frontier", "Training Observations"],
			loc="lower left", prop=fm.FontProperties(size=9))
		for text in leg.get_texts():
			text.set_color("white")
			sys.stdout.write("model plotted\n")

		tooltip = mpld3.plugins.PointLabelTooltip(scatter, labels=labels)
		mpld3.plugins.connect(plt.gcf(), tooltip)

	def show(self):
		plt.show()

	def save(self, savePKL=False, savePNG=False, saveHTML=False):
		if savePKL:
			joblib.dump(self.pca, self.pcaPath)
			joblib.dump(self.clf, self.clfPath)
		if savePNG:
			my_stringIObytes = io.BytesIO()
			plt.savefig(my_stringIObytes, bbox_inches="tight")
			my_stringIObytes.seek(0)
			self.fig_64 = base64.b64encode(my_stringIObytes.read())
		if saveHTML:
			self.fig_d3_html = mpld3.fig_to_html(plt.gcf())
		sys.stdout.write("model saved\n")

	def close(self):
		plt.close()
		sys.stdout.write("model closed\n")

# AMQP
dotenv_path = join(dirname(__file__), ".env")
load_dotenv(dotenv_path)
CLOUDAMQP_URL = os.environ.get("CLOUDAMQP_URL")

connection = pika.BlockingConnection(pika.connection.URLParameters(CLOUDAMQP_URL))
channel = connection.channel()

# TASK CONSUMER
channel.queue_declare(queue="tasks", durable=True)

def task_callback(ch, method, properties, body):
	sys.stdout.write("CONSUMING TASK\n")
	sys.stdout.flush()
	lines = body.decode("utf-8").split("\n")
	modelId = lines[0]
	modelMethod = lines[1]
	pcaPath = lines[2]
	clfPath = lines[3]
	samples = eval(lines[4])
	labels = eval(lines[5])
	model = Model(pcaPath, clfPath)
	modelStatus = ""
	modelData = ""

	try:
		model.methods[modelMethod](samples)
		model.plot(modelMethod, labels, levels=64)
		model.save(savePKL=(modelMethod=="train"))
		modelStatus = "success"
		modelData = {"decisionFunction": str(model.decision_function), "scatter": str(model.scatter)} #model.fig_64
	except Exception as err:
		sys.stdout.write("Model Error!\n")
		sys.stdout.write(repr(err) + "\n")
		modelStatus = "error"
		modelData = ""

	model.close()
	task_callback_prologue(ch, method, modelId, modelStatus, modelData)	

def task_callback_prologue(ch, method, id, status, data):
	sys.stdout.write("PUBLISHING STATUS\n")
	sys.stdout.flush()
	ch.basic_ack(delivery_tag=method.delivery_tag)
	body = "{\"id\":\"" + id + "\",\"status\":\"" + status + "\""
	for key in data.keys():
		body += ",\"" + key + "\":\"" + data[key] + "\""
	body += "}"
	channel.basic_publish(exchange="", routing_key="status", body=body)
	sys.stdout.write("STATUS PUBLISHED\n")
	sys.stdout.flush()

channel.basic_consume(task_callback, queue="tasks")

# LOGOUT CONSUMER
channel.queue_declare(queue="logout", durable=True)

def logout_callback(ch, method, properties, body):
	sys.stdout.write("CONSUMING LOGOUT\n")
	lines = body.decode("utf-8").split("\n")
	for path in lines:
		try:
			os.remove(path)
		except Exception as err:
			pass
	sys.stdout.flush()
	ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(logout_callback, queue="logout")

# STATUS PUBLISHER

channel.queue_declare(queue="status", durable=True)

channel.start_consuming()
