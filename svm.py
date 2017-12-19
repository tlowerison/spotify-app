import sys, json
import numpy as np
import matplotlib.pyplot as plt, mpld3
import matplotlib.font_manager
from sklearn import svm
from sklearn.decomposition import PCA
from sklearn.externals import joblib
import seaborn as sns
import optunity
import optunity.metrics
import pandas
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
                   prop=matplotlib.font_manager.FontProperties(size=9))
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