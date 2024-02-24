type AnalyticsData = {
	cached: 0 | 1;
};

export function writeDataPoint(analytics: AnalyticsEngineDataset | undefined, request: Request, data?: AnalyticsData) {
	if (!analytics) { return; }
	/* ORDER HERE IS VERY IMPORTANT. IF ANYTHING CHANGES, MUST BE APPENDED */
	const reportData = {
		blobs: [
			request.url,
			request.headers.get('user-agent'),
			request.headers.get('referer'),
			(request.cf?.httpProtocol as string) || 'invalid',
			(request.cf?.city as string) || 'unknown city',
			(request.cf?.colo as string) || 'missing colo',
			(request.cf?.country as string) || 'missing country',
			(request.cf?.tlsVersion as string) || 'invalid TLS',
		],
		doubles: [
			(request.cf?.asn as number) || 0,
			data?.cached || 0,
		],
	};
	try {
		analytics?.writeDataPoint?.(reportData);
	} catch (err) {
		console.error(err);
	}
}
