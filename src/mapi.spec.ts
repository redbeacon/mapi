import 'colors';
import {Mapi} from './mapi';

describe('Test Mapi', () => {

  beforeEach(() => {
    console.log = jasmine.createSpy('console.log');
    Mapi.prototype.createServer = jasmine.createSpy('createServer');
    Mapi.prototype.exit = jasmine.createSpy('exit');
  })

  describe('Constructor', () => {
    var originalReadFile = Mapi.prototype.readFile;
    var originalUsage = Mapi.prototype.usage;

    beforeEach(() => {
      Mapi.prototype.readFile = jasmine.createSpy('readFile').andReturn('{}');
      Mapi.prototype.usage = jasmine.createSpy('usage');
    })

    afterEach(() => {
      Mapi.prototype.readFile = originalReadFile;
      Mapi.prototype.usage = originalUsage;
    })

    it('should fail when there are no files given', () => {
      var mapi = new Mapi([]);
      expect(mapi.usage).toHaveBeenCalledWith('Please provide a DB');
      expect(mapi.exit).toHaveBeenCalledWith(1);
      expect(mapi.readFile).not.toHaveBeenCalled();
      expect(mapi.createServer).not.toHaveBeenCalled();
    })

    it('should init with defaults', () => {
      var mapi = new Mapi(['testfile.json']);
      expect(mapi.readFile).toHaveBeenCalledWith('testfile.json');
      expect(mapi.createServer).toHaveBeenCalledWith(9000, 'localhost');
      expect(console.log).toHaveBeenCalledWith('%s %s', 'Mock server started'.green,
        'http://localhost:9000/_mapi/'.magenta.underline);
    })

    it('should init with given values', () => {
      var mapi = new Mapi(['testfile.json', '8080', '0.0.0.0']);
      expect(mapi.readFile).toHaveBeenCalledWith('testfile.json');
      expect(mapi.createServer).toHaveBeenCalledWith(8080, '0.0.0.0');
      expect(console.log).toHaveBeenCalledWith('%s %s', 'Mock server started'.green,
        'http://0.0.0.0:8080/_mapi/'.magenta.underline);
    })

    it('should init if only port is given', () => {
      var mapi = new Mapi(['testfile.json', '8080']);
      expect(mapi.readFile).toHaveBeenCalledWith('testfile.json');
      expect(mapi.createServer).toHaveBeenCalledWith(8080, 'localhost');
      expect(console.log).toHaveBeenCalledWith('%s %s', 'Mock server started'.green,
        'http://localhost:8080/_mapi/'.magenta.underline);
    })
  })

  describe('readFile method', () => {
    var originalUsage = Mapi.prototype.usage;

    beforeEach(() => {
      Mapi.prototype.usage = jasmine.createSpy('usage');
    })

    afterEach(() => {
      Mapi.prototype.usage = originalUsage;
    })

    it('should read the given file', () => {
      var result = Mapi.prototype.readFile('./example_fixtures.json');
      // sufficient enough JSON content
      expect(result).toContain('": "');
      expect(result).toContain('{');
      expect(result).toContain('}');

      // revert usage
      Mapi.prototype.usage = originalUsage;
    })

    it('should throw warning when file is not found', () => {
      Mapi.prototype.readFile('./notfound.json');
      // sufficient enough JSON content
      expect(Mapi.prototype.usage).toHaveBeenCalledWith('Could not read ./notfound.json');
      expect(Mapi.prototype.exit).toHaveBeenCalledWith(1);
    })
  })

  describe('usage method', () => {
    /**
     * Returns all the calls of a spy function
     */
    var getCalls = (func): any[]=> {
      return func.calls;
    }

    beforeEach(() => {
      console.log = jasmine.createSpy('console.log');
    })

    it('should call console with instructions', () => {
      Mapi.prototype.usage();
      expect(getCalls(console.log).length).toEqual(7);
    })

    it('should first call empty because no error given', () => {
      Mapi.prototype.usage();
      expect(getCalls(console.log)[0].args[0]).toBe(''.red);
    })

    it('should print error message when given', () => {
      Mapi.prototype.usage('this is error');
      expect(getCalls(console.log)[0].args[0]).toBe('this is error'.red);
    })
  })

  describe('log method', () => {
    beforeEach(() => {
      console.log = jasmine.createSpy('console.log');
    })

    it('should log given message full arguments', () => {
      var message = Mapi.prototype.log(200, '/abc', 'success');
      expect(console.log).toHaveBeenCalledWith('- %s %s, %s', '[ 200 ]'.green, '/abc'.yellow, 'success'.grey);
      expect(message).toBe('success');
    })

    it('should print without message as well', () => {
      var message = Mapi.prototype.log(200, '/abc');
      expect(console.log).toHaveBeenCalledWith('- %s %s, %s', '[ 200 ]'.green, '/abc'.yellow, ''.grey);
      expect(message).toBe('');
    })

    it('should print status in red if it is not 200', () => {
      // Try with none 200
      Mapi.prototype.log(400, '/abc');
      expect(console.log).toHaveBeenCalledWith('- %s %s, %s', '[ 400 ]'.red, '/abc'.yellow, ''.grey);
      // Try 200 again
      Mapi.prototype.log(200, '/abc');
      expect(console.log).toHaveBeenCalledWith('- %s %s, %s', '[ 200 ]'.green, '/abc'.yellow, ''.grey);
    })
  })

  describe('serveStatic method', () => {
    beforeEach(() => {
      // mock http.ServerResponse object
      // mock fs module somehow
    })

    // provide real file
    it('should call serverResponse.writeHead with correct values', () => {
      // check if serverResponse.writeHead was called with [200, { 'Content-Type': mimeType }]
      // check if fs module methods call with correct values
    })

    // provide non existant file
    it('should call serverResponse with 404 headers', () => {
      // check if serverResponse.writeHead was called with [404, { 'Content-Type': 'text/plain' }]
      // check if serverResponse.write was called with ['404 Not Found\n']
      // check if serverResponse.end was called
    })
  })

  describe('sendResponse method', () => {
    beforeEach(() => {
      // mock http.ServerResponse object
    })

    it('should call serverResponse functions correctly', () => {
      // check if http.ServerResponse.writeHead was called with correct status and headers
      // check if http.ServerResponse.end was called with content
    })

    it('should apply corrrect status code', () => {
      // send different status code, check if it was applied to header
    })
  })

  describe('searchMap', () => {
    // Create fixture files for each possible scenario
    // initiate Mapi with respective fixture for each test
    // - test if normal url is found
    // - test if same url without trailing slash or vice versa is found
    // - test if no status code was defined default should be 200
    // - test if it can get the response for given METHOD
    // - test if urls with wild cards are matched
    // - test what happens when given url or method is not found
    // - test fixtures with really messy urls
    // - test wildcard urls are correctly sanitized
    // - test wild card is allowed any place in string
    // - test multiple wildcards are handled properly
  })
})
