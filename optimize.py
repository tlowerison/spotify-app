# Model Class function used for optimizing One Class SVM
# Does grid search on nu and gamma for the SVM
# not required for operation of actual modelling

import optunity
import optunity.metrics
import pandas

gamma_weight = 0.7
nu_weight = 0.4

def optimize(self, data, nu_range=[0.0001, 0.00025, 0.0005, 0.001, 0.0025, 0.005], gamma_range=[0.75, 1.125, 1.5, 2.625, 3.75, 5.25]):
	self.pca = PCA(n_components=2)
	self.X_train = self.pca.fit_transform(np.array(data) * scale)
	@optunity.cross_validated(x=self.X_train, num_folds=5, num_iter=2)
	def svm_auc(x_train, x_test, logNu, logGamma):
		nu = 2 ** logNu
		gamma = 2 ** logGamma
		model = svm.OneClassSVM(nu=nu, gamma=gamma).fit(x_train)
		decision_values = model.decision_function(x_test)
		return gamma ** gamma_weight / nu ** nu_weight * decision_values[0]

	points = 20

	# perform tuning
	hps, info, _ = optunity.maximize(svm_auc, num_evals=points**2, logNu=[-2.47, -2.46], logGamma=[-0.04, 0])

	df = optunity.call_log2dataframe(info.call_log)
	reshape = lambda x: np.reshape(x, (points, points))
	lognus = reshape(df['logNu'])
	loggammas = reshape(df['logGamma'])
	values = reshape(df['value'])

	f = np.vectorize(exp)
	nus = f(lognus)
	gammas = f(loggammas)

	plt.xlabel("nu")
	plt.ylabel("gamma")

	extent = [-5, -0.5, -5, 1]
	print(extent)
	plt.imshow(values, interpolation="nearest")#, extent=extent)

	#plt.plot(lognus, loggammas, values, levels=np.linspace(values.min(), 0, 20))
	plt.show()

	print("nu =", hps['logNu'], "gamma =", hps['logGamma'])
	# train model on the full training set with tuned hyperparameters
	#self.clf = svm.OneClassSVM(nu=2 ** hps['logNu'], gamma=2 ** hps['logGamma']).fit(data)

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
