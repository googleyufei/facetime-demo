package com.qycloud.web.utils;

import org.apache.log4j.Logger;

import com.conlect.oatos.utils.SysLogger;

public class Logs {
	/**
	 * Get the log object
	 * 
	 * @return Log
	 */
	public static Logger getLogger() {
		return SysLogger.osLogger;
	}

}
