///<reference path='definitions/jasmine.d.ts'/>
///<reference path='mapi.ts'/>
require('colors');

describe('Test Mapi', () => {
	var mapi;

	beforeEach(() => {
		console.log = jasmine.createSpy('console.log');
		mapi = require('../dist/mapi.js');
		mapi.Mapi.prototype.createServer = jasmine.createSpy('createServer');
		mapi.Mapi.prototype.exit = jasmine.createSpy('exit');
	});


	describe('Constructor', () => {
		beforeEach(() => {
			mapi.Mapi.prototype.readFile = jasmine.createSpy('readFile').andReturn('{}');
			mapi.Mapi.prototype.usage = jasmine.createSpy('usage');
		});

		it('should fail when there are no files given', () => {
			var a = new mapi.Mapi([]);
			expect(a.usage).toHaveBeenCalledWith('Please provide a DB');
			expect(a.exit).toHaveBeenCalledWith(1);
			expect(a.readFile).not.toHaveBeenCalled();
			expect(a.createServer).not.toHaveBeenCalled();
		});

		it('should init with defaults', () => {
			var a = new mapi.Mapi(['testfile.json']);
			expect(a.readFile).toHaveBeenCalledWith('testfile.json');
			expect(a.createServer).toHaveBeenCalledWith(9000, 'localhost');
			expect(console.log).toHaveBeenCalledWith('%s %s', 'Mock server started'.green,
															  'http://localhost:9000/_mapi/'.magenta.underline);
		});

		it('should init with given values', () => {
			var a = new mapi.Mapi(['testfile.json', 8080, '0.0.0.0']);
			expect(a.readFile).toHaveBeenCalledWith('testfile.json');
			expect(a.createServer).toHaveBeenCalledWith(8080, '0.0.0.0');
			expect(console.log).toHaveBeenCalledWith('%s %s', 'Mock server started'.green,
															  'http://0.0.0.0:8080/_mapi/'.magenta.underline);
		});

		it('should init if only port is given', () => {
			var a = new mapi.Mapi(['testfile.json', 8080]);
			expect(a.readFile).toHaveBeenCalledWith('testfile.json');
			expect(a.createServer).toHaveBeenCalledWith(8080, 'localhost');
			expect(console.log).toHaveBeenCalledWith('%s %s', 'Mock server started'.green,
															  'http://localhost:8080/_mapi/'.magenta.underline);
		});
	});
});