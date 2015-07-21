///<reference path='definitions/node.d.ts'/>
///<reference path='definitions/colors.d.ts'/>
///<reference path='definitions/jasmine.d.ts'/>
require('colors');

import {Mapi} from './mapi';

describe('Test Mapi', () => {

	beforeEach(() => {
		console.log = jasmine.createSpy('console.log');
		Mapi.prototype.createServer = jasmine.createSpy('createServer');
		Mapi.prototype.exit = jasmine.createSpy('exit');
	});

	describe('Constructor', () => {
		var originalReadFile = Mapi.prototype.readFile;
		beforeEach(() => {
			Mapi.prototype.readFile = jasmine.createSpy('readFile').andReturn('{}');
			Mapi.prototype.usage = jasmine.createSpy('usage');
		});

		afterEach(()=>{
			Mapi.prototype.readFile = originalReadFile;
		});

		it('should fail when there are no files given', () => {
			var a = new Mapi([]);
			expect(a.usage).toHaveBeenCalledWith('Please provide a DB');
			expect(a.exit).toHaveBeenCalledWith(1);
			expect(a.readFile).not.toHaveBeenCalled();
			expect(a.createServer).not.toHaveBeenCalled();
		});

		it('should init with defaults', () => {
			var a = new Mapi(['testfile.json']);
			expect(a.readFile).toHaveBeenCalledWith('testfile.json');
			expect(a.createServer).toHaveBeenCalledWith(9000, 'localhost');
			expect(console.log).toHaveBeenCalledWith('%s %s', 'Mock server started'.green,
															  'http://localhost:9000/_mapi/'.magenta.underline);
		});

		it('should init with given values', () => {
			var a = new Mapi(['testfile.json', '8080', '0.0.0.0']);
			expect(a.readFile).toHaveBeenCalledWith('testfile.json');
			expect(a.createServer).toHaveBeenCalledWith(8080, '0.0.0.0');
			expect(console.log).toHaveBeenCalledWith('%s %s', 'Mock server started'.green,
															  'http://0.0.0.0:8080/_mapi/'.magenta.underline);
		});

		it('should init if only port is given', () => {
			var a = new Mapi(['testfile.json', '8080']);
			expect(a.readFile).toHaveBeenCalledWith('testfile.json');
			expect(a.createServer).toHaveBeenCalledWith(8080, 'localhost');
			expect(console.log).toHaveBeenCalledWith('%s %s', 'Mock server started'.green,
															  'http://localhost:8080/_mapi/'.magenta.underline);
		});
	});

	describe('usage method', ()=>{
		it('should read the given file', ()=>{
			var result = Mapi.prototype.readFile('./example_fixtures.json');
			// suffician enought JSON content
			expect(result).toContain('": "');
			expect(result).toContain('{');
			expect(result).toContain('}');
		});

		it('should throw warning when file is not found', ()=>{
			Mapi.prototype.readFile('./notfound.json');
			// suffician enought JSON content
			expect(Mapi.prototype.usage).toHaveBeenCalledWith('Could not read ./notfound.json');
			expect(Mapi.prototype.exit).toHaveBeenCalledWith(1);
		});
	});
});
