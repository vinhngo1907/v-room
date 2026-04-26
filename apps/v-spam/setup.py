from setuptools import setup, find_packages

setup(
    name="spam_service",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "kafka-python",
        "python-dotenv",
        "joblib",
        "scikit-learn==1.0.2",
        "numpy==1.21.6",
        "scipy==1.7.3",
    ],
)
