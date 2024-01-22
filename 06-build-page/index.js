let path = require('path');
let fs = require('fs');
let pathStyles = path.join(__dirname, 'styles');
let pathCopy = path.join(__dirname, 'project-dist');
let pathAssetsCopy = path.join(pathCopy, 'assets');
let folderPath = path.join(__dirname, 'components');
let pathAssets = path.join(__dirname, 'assets');

fs.readdir(pathStyles, { withFileTypes: true }, async (error, files) => {
    if (error) {
        console.log(error);
    }
    else {
        files.forEach(function (file, index) {
            let filePath = path.join(pathStyles, file.name);
            if (file.isFile() && file.name.split('.')[1] === 'css') {
                fs.readFile(filePath, 'utf8', function (error, data) {
                    if (error) {
                        console.log(error);
                    } else if (index === 0) {
                        fs.writeFile(path.join(pathCopy, 'style.css'), data, function (error) {
                            if (error)
                                console.log(error);
                        });
                    } else {
                        fs.appendFile(path.join(pathCopy, 'style.css'), data, function (error) {
                            if (error)
                                console.log(error);
                        });
                    }
                });
            }
        });
    }
});

function recurceCopy(dir, exit) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, { withFileTypes: true }, function (error, files) {
            if (error) {
                reject(error);
            } else {
                let copyOperations = files.map(function (file) {
                    return new Promise((resolve, reject) => {
                        let oldPath = path.join(dir, file.name);
                        let newPath = path.join(exit, file.name);

                        if (!file.isFile()) {
                            fs.mkdir(newPath, { recursive: true }, function (error) {
                                if (error) {
                                    reject(error);
                                } else {
                                    recurceCopy(oldPath, newPath).then(resolve).catch(reject);
                                }
                            });
                        } else {
                            fs.copyFile(oldPath, newPath, function (error) {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve();
                                }
                            });
                        }
                    });
                });

                Promise.all(copyOperations).then(() => resolve()).catch(error => reject(error));
            }
        });
    });
}

fs.stat(pathCopy, function (error) {
    if (error) {
        fs.mkdir(pathCopy, function (error) {
            if (error) {
                return console.error(error);
            }
        });
        createTemplate();
    } else {
        fs.readdir(pathCopy, function (error) {
            if (error)
                console.log(error);
            else {

                createTemplate();
            }
        });
    }
});

fs.stat(pathAssetsCopy, function (error) {
    if (error) {
        fs.mkdir(pathAssetsCopy, function (error) {
            if (error) {
                return console.error(error);
            }

        });
        recurceCopy(pathAssets, pathAssetsCopy);
    } else {
        recurceCopy(pathAssets, pathAssetsCopy);
    }
});

function createTemplate() {
    fs.copyFile(`${__dirname}\\template.html`, `${pathCopy}\\index.html`, function (error) {
        if (error) throw error;
        fs.readFile(`${pathCopy}\\index.html`, 'utf8', function (error, data) {
            if (error) throw error;
            fs.readdir(folderPath, { withFileTypes: true }, function (error, files) {
                if (error) throw error;

                let replacements = [];
                files.forEach(function (file) {
                    replacements.push(new Promise((resolve, reject) => {
                        fs.readFile(`${folderPath}\\${file.name}`, 'utf8', function (error, dataFile) {
                            if (error) reject(error);
                            let tagName = `{{${file.name.split('.')[0]}}}`;
                            resolve({tag: tagName, data: dataFile});
                        });
                    }));
                });

                Promise.all(replacements).then(values => {
                    values.forEach(replacement => {
                        data = data.replace(replacement.tag, replacement.data);
                    });
                    fs.writeFile(`${pathCopy}\\index.html`, data, function (error) {
                        if (error)
                            console.log(error);
                    });
                }).catch(error => {
                    console.log(error);
                });

            });

        });

    });
}
