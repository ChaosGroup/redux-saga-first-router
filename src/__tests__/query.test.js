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

	it('works with arrays', () => {
		expect(queryStringify({ foo: ['bar', 'baz'] })).toEqual('foo=bar&foo=baz');
		expect(queryStringify({ foo: ['bar', 'bar'] })).toEqual('foo=bar');
		expect(queryStringify({ foo: [null, null] })).toEqual('foo');
		expect(queryStringify({ foo: ['', null] })).toEqual('foo=&foo');
		expect(queryStringify({ foo: ['bar', ''] })).toEqual('foo=bar&foo=');
		expect(queryStringify({ foo: ['', 'bar'] })).toEqual('foo=&foo=bar');
	});
});

describe('queryParse', () => {
	it('will parse a querystring to an object', () => {
		const obj = queryParse('foo=bar');

		expect(obj).toBeDefined();
		expect(obj).toEqual({ foo: 'bar' });
	});

	it('will also work if querystring is prefixed with ?', () => {
		const obj = queryParse('?foo=bar&shizzle=mynizzle');

		expect(obj).toBeDefined();
		expect(obj).toEqual({ foo: 'bar', shizzle: 'mynizzle' });
	});

	it('works with querystring parameters without values', () => {
		const obj1 = queryParse('foo&bar=&shizzle=mynizzle');

		expect(obj1).toBeDefined();
		expect(obj1).toEqual({ foo: null, bar: '', shizzle: 'mynizzle' });

		const obj2 = queryParse('foo&foo');
		expect(obj2).toBeDefined();
		expect(obj2).toEqual({ foo: [null, null] });

		const obj3 = queryParse('foo=&foo');
		expect(obj3).toBeDefined();
		expect(obj3).toEqual({ foo: ['', null] });
	});

	it('decodes plus signs', () => {
		const obj1 = queryParse('foo+bar=baz+qux');

		expect(obj1).toBeDefined();
		expect(obj1).toEqual({ 'foo bar': 'baz qux' });

		const obj2 = queryParse('foo+bar=baz%2Bqux');

		expect(obj2).toBeDefined();
		expect(obj2).toEqual({ 'foo bar': 'baz+qux' });
	});

	it('handle multiple of the same key', () => {
		const obj = queryParse('foo=bar&foo=baz');

		expect(obj).toBeDefined();
		expect(obj).toEqual({ foo: ['bar', 'baz'] });
	});

	it('handle multiple values and preserve appearance order', () => {
		const obj1 = queryParse('foo=bar&foo=');

		expect(obj1).toBeDefined();
		expect(obj1).toEqual({ foo: ['bar', ''] });

		const obj2 = queryParse('foo=&foo=bar');

		expect(obj2).toBeDefined();
		expect(obj2).toEqual({ foo: ['', 'bar'] });
	});
});
