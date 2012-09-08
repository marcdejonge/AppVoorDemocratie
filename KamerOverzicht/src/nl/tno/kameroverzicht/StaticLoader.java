package nl.tno.kameroverzicht;

import java.io.IOException;
import java.io.InputStream;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StaticLoader extends HttpServlet {
	private static final long serialVersionUID = 3512666363404799373L;

	private static final Logger logger = LoggerFactory.getLogger(StaticLoader.class);

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		logger.debug("Received GET for path " + req.getPathInfo());

		InputStream inputStream = getClass().getClassLoader().getResourceAsStream("web" + req.getPathInfo());

		if (req.getPathInfo().endsWith(".html")) {
			resp.setContentType("text/html");
		} else if (req.getPathInfo().endsWith(".csv")) {
			resp.setContentType("text/csv;charset=UTF-8");
		} else {
			resp.setContentType("text/plain");
		}

		if (inputStream == null) {
			// not found!
			logger.info(req.getPathInfo() + " is not found");
			resp.sendError(404);
		} else {
			logger.debug(req.getPathInfo() + " is found");
			byte[] block = new byte[1024];
			int read = 0;
			while ((read = inputStream.read(block)) >= 0) {
				resp.getOutputStream().write(block, 0, read);
			}
			resp.getOutputStream().close();
			inputStream.close();
		}
	}
}
