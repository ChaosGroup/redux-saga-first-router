import { queryStringify, queryParse } from '../index';

describe('queryStringify', () => {
	it('transforms an object', () => {
		expect(queryStringify({ foo: 'bar', bar: 'foo' })).toEqual('bar=foo&foo=bar');
	});

	it('works with nulled objects', () => {
		var obj = Object.create(null);
		obj.foo = 'bar';

		expect(queryStringify(obj)).toEqual('foo=bar');
	});

	it('works with falsy values', () => {
		expect(queryStringify({ foo: '' })).toEqual('foo=');
		expect(queryStringify({ foo: false })).toEqual('foo=false');
		expect(queryStringify({ foo: null })).toEqual('foo');
		expect(queryStringify({ foo: undefined })).toEqual('');
	});
});

describe('queryParse', () => {
	it('will parse a querystring to an object', () => {
		const obj = queryParse('foo=bar');

		expect(obj).toBeDefined();
		expect(obj).toHaveProperty('foo', 'bar');
	});

	it('will also work if querystring is prefixed with ?', () => {
		const obj = queryParse('?foo=bar&shizzle=mynizzle');

		expect(obj).toBeDefined();
		expect(obj).toHaveProperty('foo', 'bar');
		expect(obj).toHaveProperty('shizzle', 'mynizzle');
	});

	it('works with querystring parameters without values', () => {
		const obj = queryParse('?foo&bar=&shizzle=mynizzle');

		expect(obj).toBeDefined();
		expect(obj).toHaveProperty('foo', null);
		expect(obj).toHaveProperty('bar', '');
		expect(obj).toHaveProperty('shizzle', 'mynizzle');
	});

	it('decodes plus signs', () => {
		const obj1 = queryParse('foo+bar=baz+qux');

		expect(obj1).toBeDefined();
		expect(obj1).toHaveProperty('foo bar', 'baz qux');

		const obj2 = queryParse('foo+bar=baz%2Bqux');

		expect(obj2).toBeDefined();
		expect(obj2).toHaveProperty('foo bar', 'baz+qux');
	});
});
