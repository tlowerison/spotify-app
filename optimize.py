# Model Class function used for optimizing One Class SVM
# Does grid search on nu and gamma for the SVM
# not required for operation of actual modelling

import optunity
import optunity.metrics
import pandas

def optimize(self, data, nu_range=[0.0001, 0.00025, 0.0005, 0.001, 0.0025, 0.005], gamma_range=[0.75, 1.125, 1.5, 2.625, 3.75, 5.25]):
		@optunity.cross_validated(x=self.X_train, num_folds=5, num_iter=2)
		def svm_auc(x_train, x_test, logNu, logGamma):
			nu = 2 ** logNu
			gamma = 2 ** logGamma
			model = svm.OneClassSVM(nu=nu, gamma=gamma).fit(x_train)
			decision_values = model.decision_function(x_test)
			return gamma ** gamma_weight / nu ** nu_weight * decision_values[0]

		# perform tuning
		hps, info, _ = optunity.maximize(svm_auc, num_evals=64, logNu=[-5, -0.5], logGamma=[-5, 1])

		df = optunity.call_log2dataframe(info.call_log)
		reshape = lambda x: np.reshape(x, (8, 8))
		lognus = reshape(df['logNu'])
		loggammas = reshape(df['logGamma'])
		values = reshape(df['value'])

		print(lognus)
		print(loggammas)
		print(values)

		plt.contour(lognus, loggammas, values, levels=np.linspace(values.min(), 0, 20))
		plt.show()

		print("nu =",2 ** hps['logNu'], "gamma =", 2 ** hps['logGamma'])
		# train model on the full training set with tuned hyperparameters
		self.clf = svm.OneClassSVM(nu=2 ** hps['logNu'], gamma=2 ** hps['logGamma']).fit(data)