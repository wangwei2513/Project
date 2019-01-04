var gulp = require('gulp')
var del = require('del')
var path = require('path')
var mkdirp = require('mkdirp')
var exec = require('child_process').exec
var zip = require('gulp-zip')
var moment = require('moment')
var GulpSSH = require('gulp-ssh')
const replace = require('replace')
var mom = moment(new Date())

// update
var stampVer = 'WEBVer-' + mom.format('YYYYMMDDHHmm')
var file = path.join(__dirname, 'client/src/constants.js')
var stamp = mom.format('YYYYMMDDHH')
var exportDir = './export/dist/'
var exportBackDir = './export/' + stamp
var offline = './offline/'
var packSvr = 'campus-platform-0.0.1.tgz'

var packs = {
  client: {
    src: 'client/dist/**/*.*',
    output: 'client.zip'
  },
  client_slim: {
    src: ['client/dist/**/*.*', '!client/dist/**/*.mp4'],
    output: 'client_slim.zip'
  },
  server: {
    src: [
      './**/*.*',
      '!./**/*.log',
      '!./test/*.*',
      '!./client/**/*.*',
      '!./*.tar',
      '!./*.tar.gz',
      '!./export/**/*.*',
      '!./*.rpm',
      '!./node_modules/**/*.*',
      '!./.vscode/*.*'
    ],
    output: 'server.zip'
  },
  serverOffline: {
    src: [
      './**/*',
      '!./**/*.log',
      '!./test/*',
      '!./client/**/*',
      '!./*.tar',
      '!./*.tar.gz',
      '!./export/**/*',
      '!./.vscode/*',
      '!./server/.eslintrc.js'
    ],
    output: 'serverOffline.tar.gz'
  },
  db: {
    src: '',
    output: 'db.zip'
  }
}

var remothost = {
  config: {
    host: '192.168.8.147',
    port: 22,
    username: 'root',
    password: 'bstar'
  },
  dir: {
    client: '/opt/bstar/html',
    server: '/opt/bstar/web/nodejs',
    exportDir: '/home/xian/' + stamp,
    db: '/home/xian/' + stamp
  }
}

// eslint-disable-next-line camelcase
var remothost_2 = {
  config: {
    host: '192.168.8.113',
    // host: '192.168.0.36',
    port: 22,
    username: 'root',
    password: 'bc4-123'
    // password: 'admin123'
  },
  dir: {
    client: '/opt/bstar/html',
    server: '/opt/bstar/web/nodejs',
    exportDir: '/home/xian/' + stamp,
    db: '/home/xian/' + stamp
  }
}

// eslint-disable-next-line camelcase
var remothost_3 = {
  config: {
    // host: '139.219.105.56',
    // port: 22,
    // username: 'root',
    // password: '850724'
    host: '192.168.20.210',
    // host: '192.168.0.36',
    port: 22,
    username: 'root',
    password: 'node'
  },
  dir: {
    client: '/opt/bstar/html',
    server: '/opt/bstar/web/nodejs',
    exportDir: '/home/xian/' + stamp,
    db: '/home/xian/' + stamp
  }
}

var gulpSSH = new GulpSSH({
  ignoreErrors: false,
  sshConfig: remothost.config
})

// eslint-disable-next-line camelcase
var gulpSSH_2 = new GulpSSH({
  ignoreErrors: false,
  sshConfig: remothost_2.config
})

// eslint-disable-next-line camelcase
var gulpSSH_3 = new GulpSSH({
  ignoreErrors: false,
  sshConfig: remothost_3.config
})

gulp.task('scm:update', function(cb) {
  exec('svn upate', function(err) {
    if (err) {
      return cb(err)
    } // 返回 error
    cb() // 完成 task
  })
})

gulp.task('build:ver', function(cb) {
  replace({
    regex: new RegExp(/WEBVer-\d+/),
    replacement: stampVer,
    paths: [file],
    recursive: false,
    silent: true
  })
  cb()
})

gulp.task('clean:dir', function(cb) {
  del([exportDir + '**', offline + '**', path.join(__dirname, packSvr)], cb())
})

gulp.task('clean:client', function(cb) {
  del([path.join(exportDir, packs.client.output), path.join(exportDir, packs.client_slim.output)], cb())
})

gulp.task('build:client', ['build:ver'], function(cb) {
  exec('npm run pro:build', function(err) {
    if (err) {
      return cb(err)
    } // 返回 error
    cb() // 完成 task
  })
})

gulp.task('build:zipclient', ['build:client'], function(cb) {
  mkdirp.sync(exportDir)
  return gulp
    .src(packs.client.src)
    .pipe(zip(packs.client.output))
    .pipe(gulp.dest(exportDir))
})

gulp.task('export:zipclient', function(cb) {
  mkdirp.sync(exportDir)
  return gulp
    .src(packs.client.src)
    .pipe(zip(packs.client.output))
    .pipe(gulp.dest(exportDir))
})

gulp.task('export:back', function(cb) {
  mkdirp.sync(exportBackDir)
  return gulp.src(exportDir + '/*.*').pipe(gulp.dest(exportBackDir))
})

// gulp.task('export:env', function(cb) {
//   mkdirp.sync(exportDir)
//   return gulp.src('./.env').pipe(gulp.dest(exportDir))
// })

gulp.task('build:zipclientslim', ['build:client'], function(cb) {
  mkdirp.sync(exportDir)
  return gulp
    .src(packs.client_slim.src)
    .pipe(zip(packs.client_slim.output))
    .pipe(gulp.dest(exportDir))
})

gulp.task('export:zipclientslim', function(cb) {
  mkdirp.sync(exportDir)
  return gulp
    .src(packs.client_slim.src)
    .pipe(zip(packs.client_slim.output))
    .pipe(gulp.dest(exportDir))
})

gulp.task('clean:server', function(cb) {
  del([path.join(exportDir, packs.server.output)], cb)
})

gulp.task('export:zipserver', function(cb) {
  mkdirp.sync(exportDir)
  return gulp
    .src(packs.server.src)
    .pipe(zip(packs.server.output))
    .pipe(gulp.dest(exportDir))
})

gulp.task('server:npm_pack', function(cb) {
  exec('npm pack', function(err) {
    if (err) {
      return cb(err)
    }
    cb()
  })
})

gulp.task('copy:server_tgz', ['server:npm_pack'], function(cb) {
  mkdirp.sync(offline)
  var src = path.join(__dirname, packSvr)
  return gulp.src(src).pipe(gulp.dest(offline))
})

gulp.task('tar:server', ['copy:server_tgz'], function(cb) {
  var dir = path.join(__dirname, offline, packSvr)
  exec('tar -xzf ' + dir + ' -C ' + offline, function(err) {
    if (err) {
      return cb(err)
    }
    cb()
  })
})

gulp.task('sync:.bin', ['tar:server'], function(cb) {
  var srcDir = './node_modules/.bin'
  var destPath = path.join(offline, '/package/node_modules/')
  exec('cp -r ' + srcDir + ' ' + destPath, function(err) {
    if (err) {
      return cb(err)
    }
    cb()
  })
})
gulp.task('export:offlineserver', ['sync:.bin'], function(cb) {
  mkdirp.sync(exportDir)
  var outFile = path.join(__dirname, exportDir, packs.serverOffline.output)
  var srcDir = path.join(__dirname, offline, '/package')
  exec('cd ' + srcDir + ' && tar -czf ' + outFile + ' * .[!.]* --exclude .svn', function(err) {
    if (err) {
      console.log('export:offlineserver failed: ' + err)
      return cb(err) // 返回 error
    }
    console.log(outFile)
    cb() // 完成 task
  })
})

gulp.task('upload:client', ['build:client'], function(cb) {
  return gulp
    .src(packs.client_slim.src)
    .pipe(gulpSSH.dest(remothost.dir.client))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('uploadonly:client', function(cb) {
  return gulp
    .src(packs.client_slim.src)
    .pipe(gulpSSH.dest(remothost.dir.client))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('upload:server', function(cb) {
  return gulp
    .src(packs.server.src)
    .pipe(gulpSSH.dest(remothost.dir.server))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('uploadonlyhost_2:client', function(cb) {
  console.log('remote host: ' + remothost_2.config.host)
  return gulp
    .src(packs.client_slim.src)
    .pipe(gulpSSH_2.dest(remothost_2.dir.client))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('uploadhost_2:server', function(cb) {
  console.log('remote host: ' + remothost_2.config.host)
  return gulp
    .src(packs.server.src)
    .pipe(gulpSSH_2.dest(remothost_2.dir.server))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('update:client', ['build:zipclientslim'], function(cb) {
  mkdirp.sync(exportDir)
  return gulp
    .src(path.join(exportDir, packs.client_slim.output))
    .pipe(gulpSSH.dest(remothost.dir.exportDir))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('updateonly:client', function(cb) {
  mkdirp.sync(exportDir)
  return gulp
    .src(path.join(exportDir, packs.client_slim.output))
    .pipe(gulpSSH.dest(remothost.dir.exportDir))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('update:server', ['export:zipserver'], function(cb) {
  mkdirp.sync(exportDir)
  return gulp
    .src(path.join(exportDir, packs.server.output))
    .pipe(gulpSSH.dest(remothost.dir.exportDir))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('clean:dist', function(cb) {
  del(['client/dist.zip', 'client/dist', 'client/client.zip', 's1.zip', 'server.zip', exportDir], cb)
})

gulp.task('clean:distBack', function(cb) {
  del([exportBackDir], cb)
})

gulp.task('clean:export', function(cb) {
  del([exportDir], cb)
})

gulp.task('svn:build:client', ['scm:update', 'build:ver'], function(cb) {
  exec('npm run pro:build', function(err) {
    if (err) {
      return cb(err)
    } // 返回 error
    cb() // 完成 task
  })
})

gulp.task('public:deploy:svn:client', ['svn:build:client'], function(cb) {
  return gulp
    .src(packs.client_slim.src)
    .pipe(gulpSSH_3.dest(remothost_3.dir.client))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('public:deploy:client', ['build:client'], function(cb) {
  return gulp
    .src(packs.client_slim.src)
    .pipe(gulpSSH_3.dest(remothost_3.dir.client))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('public:deploy:server', function(cb) {
  return gulp
    .src(packs.server.src)
    .pipe(gulpSSH_3.dest(remothost_3.dir.server))
    .on('error', function(err) {
      console.log(err)
    })
})

gulp.task('svn:npm:install', ['public:deploy:svn:client', 'public:deploy:server'], function(cb) {
  return gulpSSH_3.shell(['cd ' + remothost_3.dir.server, 'npm install'])
})

gulp.task('npm:install', ['public:deploy:client', 'public:deploy:server'], function(cb) {
  return gulpSSH_3.shell(['cd ' + remothost_3.dir.server, 'npm install'])
})

gulp.task('deploy:svn:node', ['svn:npm:install'], function(cb) {
  return gulpSSH_3.shell(['cd ' + remothost_3.dir.server, 'NAME=node node kill.js'])
})

gulp.task('deploy:node', ['npm:install'], function(cb) {
  return gulpSSH_3.shell(['cd ' + remothost_3.dir.server, 'NAME=node node kill.js'])
})

gulp.task('buildslim', ['clean:export', 'build:client', 'build:zipclientslim', 'export:zipserver'])
gulp.task('export', ['clean:export', 'export:zipclient', 'export:zipserver'])
gulp.task('exportslim', ['clean:export', 'export:zipclientslim', 'export:zipserver'])
gulp.task('deploy:client', ['clean:client', 'build:client', 'upload:client'])
gulp.task('deploy:server', ['upload:server'])
gulp.task('deployhost_2', ['uploadonlyhost_2:client', 'uploadhost_2:server'])
gulp.task('upload', ['uploadonly:client', 'upload:server'])
gulp.task('deploy:offline', ['clean:dir', 'build:zipclientslim', 'export:offlineserver'])
gulp.task('public:svn:deploy', ['deploy:svn:node'])
gulp.task('public:deploy', ['deploy:node'])
gulp.task('deploy', ['deploy:client', 'deploy:server'])
gulp.task('update', ['update:client', 'update:server'])
gulp.task('deupdate', ['deploy', 'update'])
gulp.task('default', ['clean:dist', 'build:client', 'deploy:offline'])
